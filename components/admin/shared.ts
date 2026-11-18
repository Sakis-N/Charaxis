import { supabase } from "@/lib/supabase/client";

export type Design = {
  fields?: { id: string; label: string; value: string }[];
  photos?: { field: string; path: string }[];
} | null;
export type OrderItem = { id: string; product_id?: string | null; product_name_snapshot: string; quantity: number; line_total: number; custom_design: Design };
export type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: { address?: string; city?: string; postcode?: string; pickup_point?: string | null; locker_id?: string | null };
  shipping_method: string;
  shipping_cost: number;
  discount_amount: number;
  subtotal?: number;
  total: number;
  status: string;
  payment_provider: string;
  payment_status: string;
  notes: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  production_time?: string | null;
  boxnow_parcel_id?: string | null;
  order_items: OrderItem[];
};

export const STATUSES: Record<string, string> = {
  pending: "Σε αναμονή",
  paid: "Πληρώθηκε",
  processing: "Σε παραγωγή",
  shipped: "Στάλθηκε",
  completed: "Ολοκληρώθηκε",
  cancelled: "Ακυρώθηκε",
};
export const METHOD: Record<string, string> = { acs: "ACS", boxnow: "BoxNow" };
export const PAY: Record<string, string> = { stripe: "Κάρτα", bank_transfer: "Κατάθεση", iris: "IRIS" };

export const money = (n: number) => `${Number(n || 0).toFixed(2)} €`;
export const fmt = (d: string) => new Date(d).toLocaleString("el-GR", { dateStyle: "short", timeStyle: "short" });
export const code = (id: string) => id.slice(0, 8).toUpperCase();
export const ago = (d: string) => {
  const h = (Date.now() - new Date(d).getTime()) / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}' πριν`;
  if (h < 24) return `${Math.round(h)} ώρες πριν`;
  const days = Math.round(h / 24);
  return days === 1 ? "χθες" : `${days} μέρες πριν`;
};

// Σε ποιο "στάδιο δουλειάς" είναι η παραγγελία (για τον πίνακα «Σήμερα»).
export type Stage = "abandoned" | "await_payment" | "to_start" | "engraving" | "shipped" | "done" | "cancelled";
export function stageOf(o: Order): Stage {
  if (o.status === "cancelled") return "cancelled";
  if (o.status === "completed") return "done";
  if (o.status === "shipped") return "shipped";
  if (o.status === "processing") return "engraving";
  const paid = o.payment_status === "paid" || o.status === "paid";
  if (paid) return "to_start";
  // Κάρτα που δεν πληρώθηκε μέσα σε 2 ώρες = εγκατέλειψε το checkout.
  if (o.payment_provider === "stripe" && Date.now() - new Date(o.created_at).getTime() > 2 * 36e5) return "abandoned";
  return "await_payment";
}

export const STAGES: { key: Stage; label: string; hint: string; tone: string }[] = [
  { key: "await_payment", label: "Περιμένουν πληρωμή", hint: "Μόλις δεις την κατάθεση, πάτα «Ήρθε η πληρωμή».", tone: "bg-[#F3E3C8]" },
  { key: "to_start", label: "Να ξεκινήσω", hint: "Πληρωμένες. Τύπωσε το φύλλο και ξεκίνα τη χάραξη.", tone: "bg-[#F6D5C3]" },
  { key: "engraving", label: "Στη χάραξη", hint: "Όταν πακετάρεις, βάλε αριθμό αποστολής και «Στάλθηκε».", tone: "bg-[#E3E6D3]" },
  { key: "shipped", label: "Καθ' οδόν", hint: "Μόλις παραδοθεί, κλείσ' την.", tone: "bg-[#DCD8D0]" },
];

export async function callNotify(orderId: string, kind: "paid" | "shipped" | "started") {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const r = await fetch("/api/admin/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ order_id: orderId, kind }),
  });
  return r.ok;
}

// Ενημέρωση παραγγελίας + (προαιρετικά) email στον πελάτη. Επιστρέφει μήνυμα για τον χρήστη.
export async function updateOrder(id: string, patch: Record<string, unknown>, notify?: "paid" | "shipped" | "started") {
  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) return { ok: false, msg: "Σφάλμα: " + error.message };
  if (!notify) return { ok: true, msg: "Αποθηκεύτηκε ✓" };
  const sent = await callNotify(id, notify);
  return { ok: true, msg: sent ? "✓ Έγινε · ο πελάτης ενημερώθηκε με email" : "✓ Έγινε · (το email δεν στάλθηκε, έλεγξε τη ρύθμιση email)" };
}

// Ελληνικό κινητό σε διεθνή μορφή για Viber/WhatsApp.
export function intlPhone(p: string | null) {
  if (!p) return null;
  let d = p.replace(/[^0-9]/g, "");
  if (d.startsWith("0030")) d = d.slice(2);
  if (d.length === 10) d = "30" + d;
  return d.length >= 11 ? d : null;
}

export function addressText(o: Order) {
  const a = o.shipping_address || {};
  return [o.customer_name, a.address, [a.postcode, a.city].filter(Boolean).join(" "), o.customer_phone].filter(Boolean).join("\n");
}

export async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:border-ink disabled:opacity-40";
export const btnDark =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-ember disabled:opacity-40";
export const field =
  "rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none transition-colors focus:border-ink";
