// BoxNow Partner API (server-only). Τα κλειδιά διαβάζονται ΜΟΝΟ από μεταβλητές περιβάλλοντος.
import { BUSINESS } from "@/lib/business";
import { sbService } from "@/lib/server/sb";

const API = (process.env.BOXNOW_API_URL || "").replace(/\/+$/, "");
const CLIENT_ID = process.env.BOXNOW_CLIENT_ID;
const CLIENT_SECRET = process.env.BOXNOW_CLIENT_SECRET;
const WAREHOUSE = process.env.BOXNOW_WAREHOUSE_ID || "2";
// Μέγεθος θυρίδας: 1 μικρή, 2 μεσαία, 3 μεγάλη. Τα προϊόντα μας είναι επίπεδα (3 mm), άρα μικρή.
const SIZE = [1, 2, 3].includes(Number(process.env.BOXNOW_COMPARTMENT_SIZE)) ? Number(process.env.BOXNOW_COMPARTMENT_SIZE) : 1;

export const boxnowConfigured = Boolean(API && CLIENT_ID && CLIENT_SECRET);

let cached: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const r = await fetch(`${API}/api/v1/auth-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`BoxNow auth ${r.status}`);
  const j = await r.json();
  cached = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  return cached.token;
}

type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  boxnow_parcel_id: string | null;
  shipping_address: { locker_id?: string | null };
  order_items?: { product_name_snapshot: string; quantity: number; line_total: number }[];
};

async function loadOrder(id: string): Promise<OrderRow> {
  const r = await sbService(`orders?id=eq.${id}&select=*,order_items(*)`);
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows[0]) throw new Error("Η παραγγελία δεν βρέθηκε");
  return rows[0];
}

// Τηλέφωνο σε διεθνή μορφή (+30…).
function intl(p: string | null | undefined) {
  const d = String(p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("30")) return "+" + d;
  return "+30" + d;
}

// Δημιουργεί αίτημα παράδοσης (voucher) και αποθηκεύει το parcel id.
export async function createVoucher(orderId: string): Promise<{ parcelId: string }> {
  if (!boxnowConfigured) throw new Error("Το BoxNow δεν έχει ρυθμιστεί (λείπουν τα κλειδιά στο Netlify).");
  const o = await loadOrder(orderId);
  if (o.boxnow_parcel_id) return { parcelId: o.boxnow_parcel_id };
  const lockerId = o.shipping_address?.locker_id;
  if (!lockerId) throw new Error("Η παραγγελία δεν έχει επιλεγμένη θυρίδα BoxNow.");
  const ref = o.id.slice(0, 8).toUpperCase();
  const items = (o.order_items || []).map((it, i) => ({
    id: `${ref}-${i + 1}`,
    name: String(it.product_name_snapshot || "Προϊόν").slice(0, 100),
    value: Number(it.line_total || 0).toFixed(2),
    weight: 0,
    compartmentSize: SIZE,
  }));
  const body = {
    orderNumber: ref,
    invoiceValue: Number(o.total).toFixed(2),
    paymentMode: "prepaid",
    amountToBeCollected: "0.00",
    allowReturn: false,
    origin: {
      contactNumber: intl(process.env.BOXNOW_SENDER_PHONE || BUSINESS.phone),
      contactEmail: process.env.BOXNOW_SENDER_EMAIL || BUSINESS.email,
      contactName: process.env.BOXNOW_SENDER_NAME || "Charaxis",
      locationId: WAREHOUSE,
    },
    destination: {
      contactNumber: intl(o.customer_phone),
      contactEmail: o.customer_email,
      contactName: o.customer_name,
      locationId: String(lockerId),
    },
    items: items.length ? items : [{ id: `${ref}-1`, name: "Παραγγελία Charaxis", value: Number(o.total).toFixed(2), weight: 0, compartmentSize: SIZE }],
  };
  const t = await token();
  const r = await fetch(`${API}/api/v1/delivery-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`BoxNow ${r.status}: ${txt.slice(0, 300)}`);
  const j = JSON.parse(txt);
  const parcelId = String(j?.parcels?.[0]?.id || "");
  if (!parcelId) throw new Error("Το BoxNow δεν επέστρεψε αριθμό δέματος.");
  await sbService(`orders?id=eq.${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ boxnow_parcel_id: parcelId, tracking_number: parcelId }),
  });
  return { parcelId };
}

// Επιστρέφει το PDF του voucher.
export async function voucherPdf(orderId: string): Promise<ArrayBuffer> {
  if (!boxnowConfigured) throw new Error("Το BoxNow δεν έχει ρυθμιστεί.");
  const o = await loadOrder(orderId);
  if (!o.boxnow_parcel_id) throw new Error("Δεν έχει δημιουργηθεί voucher ακόμα.");
  const t = await token();
  const r = await fetch(`${API}/api/v1/parcels/${o.boxnow_parcel_id}/label.pdf`, {
    headers: { Accept: "application/pdf", Authorization: `Bearer ${t}` },
  });
  if (!r.ok) throw new Error(`BoxNow label ${r.status}`);
  return r.arrayBuffer();
}
