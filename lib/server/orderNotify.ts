import { BANK, BUSINESS, DELIVERY_TIMES, PRODUCTION_TIME } from "@/lib/business";
import { SITE_URL } from "@/lib/site";
import { esc, layout, sendEmail } from "./email";
import { hasService, sbService } from "./sb";

type Item = {
  product_name_snapshot: string;
  quantity: number;
  line_total: number;
  custom_design: { fields?: { label: string; value: string }[]; photos?: { path: string }[] } | null;
};
type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: { address?: string; city?: string; postcode?: string };
  shipping_method: string;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_provider: string;
  payment_status: string;
  notes: string | null;
  tracking_number: string | null;
  order_items: Item[];
};

const money = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} €`;
const shortId = (id: string) => id.slice(0, 8).toUpperCase();
const METHOD: Record<string, string> = {
  acs: "ACS Courier στο σπίτι",
  boxnow: "BoxNow (θυρίδα)",
  skroutz: "Skroutz Last Mile",
};

export async function loadOrder(id: string): Promise<Order | null> {
  if (!hasService) return null;
  const r = await sbService(`orders?id=eq.${id}&select=*,order_items(*)`);
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] ?? null;
}

function itemsHtml(o: Order, withDesign: boolean) {
  return o.order_items
    .map((i) => {
      const f = withDesign
        ? (i.custom_design?.fields || []).map((x) => `<div style="color:#8A7A62;font-size:13px">${esc(x.label)}: ${esc(x.value)}</div>`).join("") +
          ((i.custom_design?.photos?.length ?? 0) > 0 ? `<div style="color:#8A7A62;font-size:13px">📷 ${i.custom_design!.photos!.length} φωτογραφία/ες</div>` : "")
        : "";
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #DCD3BF">${i.quantity} × ${esc(i.product_name_snapshot)}${f}</td><td style="padding:8px 0;border-bottom:1px solid #DCD3BF;text-align:right;white-space:nowrap">${money(i.line_total)}</td></tr>`;
    })
    .join("");
}

function totalsHtml(o: Order) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml(o, false)}
<tr><td style="padding:6px 0;color:#8A7A62">Μεταφορικά</td><td style="text-align:right">${money(o.shipping_cost)}</td></tr>
${Number(o.discount_amount) > 0 ? `<tr><td style="padding:6px 0;color:#8A7A62">Έκπτωση</td><td style="text-align:right">−${money(o.discount_amount)}</td></tr>` : ""}
<tr><td style="padding:8px 0;font-weight:700">Σύνολο</td><td style="text-align:right;font-weight:700;color:#E2430F">${money(o.total)}</td></tr></table>`;
}

// Καλείται μία φορά ανά παραγγελία (notified_at). Για κάρτα στέλνεται μόνο αφού πληρωθεί.
export async function notifyOrderCreated(orderId: string): Promise<"sent" | "skipped"> {
  if (!hasService) return "skipped";
  const pre = await loadOrder(orderId);
  if (!pre) return "skipped";
  if (pre.payment_provider === "stripe" && pre.payment_status !== "paid") return "skipped";

  // Ατομικό "claim" ώστε να μη σταλεί δύο φορές.
  const claim = await sbService(`orders?id=eq.${orderId}&notified_at=is.null`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });
  const claimed = claim.ok ? await claim.json() : [];
  if (!claimed?.length) return "skipped";
  const o = pre;
  const sid = shortId(o.id);
  const link = `${SITE_URL}/paraggelia/${o.id}`;
  const a = o.shipping_address || {};

  const bankBlock =
    o.payment_provider === "iris"
      ? `<div style="border:1px solid #1B1714;padding:14px;margin:16px 0;font-size:14px;line-height:1.7"><b>Πληρωμή με IRIS</b><br>
Άνοιξε τη σελίδα της παραγγελίας για να δεις τον κωδικό QR, σάρωσέ τον από την εφαρμογή της τράπεζάς σου και γράψε:<br>
Ποσό: <b>${money(o.total)}</b><br>Αιτιολογία: <b>#${sid}</b></div>
<p style="font-size:14px">Ξεκινάμε την παραγωγή μόλις εμφανιστεί η πληρωμή.</p>`
      : o.payment_provider === "bank_transfer"
      ? `<div style="border:1px solid #1B1714;padding:14px;margin:16px 0;font-size:14px;line-height:1.7"><b>Στοιχεία κατάθεσης</b><br>
${BANK.name ? `Τράπεζα: ${esc(BANK.name)}<br>` : ""}${BANK.holder ? `Δικαιούχος: ${esc(BANK.holder)}<br>` : ""}${BANK.iban ? `IBAN: <b>${esc(BANK.iban)}</b><br>` : "Θα σου στείλουμε τα στοιχεία λογαριασμού σε ξεχωριστό email.<br>"}
Ποσό: <b>${money(o.total)}</b><br>Αιτιολογία: <b>#${sid}</b></div>
<p style="font-size:14px">Ξεκινάμε την παραγωγή μόλις εμφανιστεί η κατάθεση.</p>`
      : `<p style="font-size:14px">Η πληρωμή σου με κάρτα ολοκληρώθηκε ✓</p>`;

  await sendEmail({
    to: o.customer_email,
    replyTo: BUSINESS.email,
    subject: `Παραγγελία #${sid} — Charaxis`,
    html: layout(
      `Ευχαριστούμε, ${o.customer_name.split(" ")[0]}!`,
      `<p style="font-size:14px;line-height:1.6">Λάβαμε την παραγγελία σου <b>#${sid}</b>. Κάθε κομμάτι φτιάχνεται ένα-ένα· ο χρόνος παραγωγής είναι συνήθως ${PRODUCTION_TIME}, και μετά η αποστολή (${DELIVERY_TIMES[o.shipping_method] ?? "—"}).</p>
${bankBlock}${totalsHtml(o)}
<p style="font-size:13px;color:#8A7A62;margin-top:16px">Παράδοση: ${esc(METHOD[o.shipping_method] ?? o.shipping_method)} — ${esc(a.address)}, ${esc(a.city)} ${esc(a.postcode)}</p>
<p style="font-size:14px"><a href="${link}" style="color:#E2430F">Δες την κατάσταση της παραγγελίας</a></p>`
    ),
  });

  const owner = process.env.ADMIN_NOTIFY_EMAIL;
  if (owner) {
    const paid = o.payment_provider === "stripe";
    const payLabel = paid
      ? "Κάρτα — ΠΛΗΡΩΜΕΝΗ ✓"
      : o.payment_provider === "iris"
        ? "IRIS — αναμένεται πληρωμή"
        : "Τραπεζική κατάθεση — αναμένεται";
    const badge = paid ? "#2E7D32" : "#E2430F";
    const box = "border:1px solid #DCD3BF;background:#FBF9F3;padding:16px 18px;margin:0 0 14px";
    const lab = "font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8A7A62;margin:0 0 6px";
    const phone = o.customer_phone ? `<a href="tel:${esc(o.customer_phone)}" style="color:#1B1714">${esc(o.customer_phone)}</a>` : "—";
    const items = o.order_items
      .map((i) => {
        const fields = (i.custom_design?.fields || [])
          .map(
            (x) =>
              `<div style="margin:10px 0 0"><div style="font-size:12px;color:#8A7A62">${esc(x.label)}</div><div style="font-size:16px;line-height:1.5;white-space:pre-wrap">${esc(x.value)}</div></div>`
          )
          .join("");
        const nPhotos = i.custom_design?.photos?.length ?? 0;
        return `<div style="${box}"><div style="font-size:17px;font-weight:700">${i.quantity} × ${esc(i.product_name_snapshot)} <span style="float:right;color:#E2430F">${money(i.line_total)}</span></div>${fields}${nPhotos > 0 ? `<div style="margin-top:12px;font-size:14px;padding:8px 10px;background:#F2EEE2">📷 ${nPhotos} φωτογραφία/ες πελάτη — άνοιξέ τες από τη διαχείριση</div>` : ""}</div>`;
      })
      .join("");
    await sendEmail({
      to: owner,
      subject: `🛒 Νέα παραγγελία #${sid} — ${money(o.total)} — ${o.customer_name}`,
      html: `<!doctype html><html lang="el"><body style="margin:0;background:#F2EEE2;font-family:Arial,Helvetica,sans-serif;color:#1B1714">
<div style="max-width:680px;margin:0 auto;padding:24px 16px">
<div style="font-size:22px;font-weight:700;margin-bottom:6px">Charaxis</div>
<h1 style="font-size:26px;margin:0 0 4px">Νέα παραγγελία #${sid}</h1>
<div style="font-size:18px;margin:0 0 18px"><b style="color:#E2430F">${money(o.total)}</b> &nbsp;·&nbsp; <span style="color:${badge};font-weight:700">${payLabel}</span></div>

<div style="${box}"><div style="${lab}">Πελάτης</div>
<div style="font-size:17px;font-weight:700">${esc(o.customer_name)}</div>
<div style="font-size:15px;line-height:1.7"><a href="mailto:${esc(o.customer_email)}" style="color:#1B1714">${esc(o.customer_email)}</a><br>${phone}</div></div>

<div style="${box}"><div style="${lab}">Αποστολή</div>
<div style="font-size:16px;font-weight:700">${esc(METHOD[o.shipping_method] ?? o.shipping_method)}</div>
<div style="font-size:15px;line-height:1.6">${esc(a.address)}<br>${esc(a.city)} ${esc(a.postcode)}</div></div>

<div style="${lab};margin-top:20px">Προϊόντα &amp; προσαρμογές</div>
${items}

<div style="${box}">
<table style="width:100%;border-collapse:collapse;font-size:15px">
<tr><td style="padding:3px 0;color:#8A7A62">Μεταφορικά</td><td style="text-align:right">${money(o.shipping_cost)}</td></tr>
${Number(o.discount_amount) > 0 ? `<tr><td style="padding:3px 0;color:#8A7A62">Έκπτωση</td><td style="text-align:right">−${money(o.discount_amount)}</td></tr>` : ""}
<tr><td style="padding:8px 0 0;font-size:18px;font-weight:700">Σύνολο</td><td style="padding:8px 0 0;text-align:right;font-size:18px;font-weight:700;color:#E2430F">${money(o.total)}</td></tr></table></div>

${o.notes ? `<div style="${box}"><div style="${lab}">Σημειώσεις πελάτη</div><div style="font-size:15px;line-height:1.5;white-space:pre-wrap">${esc(o.notes)}</div></div>` : ""}

<p style="margin:20px 0"><a href="${SITE_URL}/admin" style="display:inline-block;background:#1B1714;color:#F2EEE2;padding:14px 26px;font-size:15px;font-weight:600;text-decoration:none">Άνοιγμα διαχείρισης</a></p>
<div style="font-size:12px;color:#8A7A62">Charaxis · Χειροποίητες laser χαράξεις σε ξύλο</div>
</div></body></html>`,
    });
  }
  return "sent";
}

export async function notifyOrderPaid(orderId: string) {
  const o = await loadOrder(orderId);
  if (!o || o.payment_provider === "stripe") return; // η κάρτα καλύπτεται από το notifyOrderCreated
  const sid = shortId(o.id);
  const first = o.customer_name.split(" ")[0];
  const step = (n: number, t: string, d: string) =>
    `<tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:700;color:#E2430F">${n}.</td><td style="padding:6px 0;font-size:14px;line-height:1.5"><b>${t}</b> ${d}</td></tr>`;
  await sendEmail({
    to: o.customer_email,
    replyTo: BUSINESS.email,
    subject: `Λάβαμε την πληρωμή σου — ξεκινάμε την παραγωγή! (#${sid})`,
    html: layout(
      `Ευχαριστούμε, ${esc(first)}!`,
      `<p style="font-size:14px;line-height:1.6">Η πληρωμή σου για την παραγγελία <b>#${sid}</b> εμφανίστηκε και ξεκινάμε να φτιάχνουμε το κομμάτι σου.</p>
<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8A7A62;margin:18px 0 6px">Η παραγγελία σου</div>
<table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml(o, true)}
<tr><td style="padding:6px 0;color:#8A7A62">Μεταφορικά</td><td style="text-align:right">${money(o.shipping_cost)}</td></tr>
<tr><td style="padding:8px 0;font-weight:700">Σύνολο</td><td style="text-align:right;font-weight:700">${money(o.total)} <span style="color:#2E7D32">✓ Πληρώθηκε</span></td></tr></table>
<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8A7A62;margin:22px 0 6px">Τι ακολουθεί</div>
<table style="border-collapse:collapse">
${step(1, "Παραγωγή:", `συνήθως ${PRODUCTION_TIME}. Κάθε κομμάτι χαράσσεται και ελέγχεται ένα-ένα.`)}
${step(2, "Αποστολή:", "μόλις είναι έτοιμο θα λάβεις email με τον αριθμό αποστολής (tracking).")}
${step(3, "Παράδοση:", `${esc(METHOD[o.shipping_method] ?? o.shipping_method)} — ${DELIVERY_TIMES[o.shipping_method] ?? "σύντομα"}.`)}
</table>
<p style="margin:22px 0"><a href="${SITE_URL}/paraggelia/${o.id}" style="display:inline-block;background:#1B1714;color:#F2EEE2;padding:12px 22px;font-size:14px;font-weight:600;text-decoration:none">Δες την κατάσταση της παραγγελίας</a></p>
<p style="font-size:14px;line-height:1.6">Χρειάζεσαι κάτι; Απάντησε απλώς σε αυτό το email.<br>${esc(BUSINESS.email)}</p>`
    ),
  });
}

export async function notifyOrderShipped(orderId: string) {
  const o = await loadOrder(orderId);
  if (!o) return;
  const sid = shortId(o.id);
  const first = o.customer_name.split(" ")[0];
  const a = o.shipping_address || {};
  await sendEmail({
    to: o.customer_email,
    replyTo: BUSINESS.email,
    subject: `Η παραγγελία σου στάλθηκε! 📦 (#${sid})`,
    html: layout(
      `Καλά νέα, ${esc(first)}!`,
      `<p style="font-size:14px;line-height:1.6">Η παραγγελία σου <b>#${sid}</b> είναι έτοιμη και στάλθηκε με <b>${esc(METHOD[o.shipping_method] ?? o.shipping_method)}</b>.</p>
${o.tracking_number ? `<div style="border:1px solid #1B1714;padding:14px;margin:16px 0;font-size:14px;line-height:1.7"><b>Αριθμός αποστολής (tracking)</b><br><span style="font-size:18px;font-weight:700;letter-spacing:.03em">${esc(o.tracking_number)}</span><br><span style="color:#8A7A62">Με αυτόν τον αριθμό παρακολουθείς το δέμα στο site της εταιρείας μεταφοράς.</span></div>` : ""}
<p style="font-size:14px;line-height:1.6">Παράδοση σε: ${esc(a.address)}, ${esc(a.city)} ${esc(a.postcode)}<br>Αναμενόμενη παράδοση: <b>${DELIVERY_TIMES[o.shipping_method] ?? "σύντομα"}</b>.</p>
<p style="font-size:14px;line-height:1.6;color:#8A7A62">Αν υπάρξει πρόβλημα με την παραλαβή ή το κομμάτι φτάσει με ζημιά, στείλε μας φωτογραφίες εντός 3 ημερών και θα το φτιάξουμε ξανά.</p>
<p style="margin:22px 0"><a href="${SITE_URL}/paraggelia/${o.id}" style="display:inline-block;background:#1B1714;color:#F2EEE2;padding:12px 22px;font-size:14px;font-weight:600;text-decoration:none">Δες την κατάσταση της παραγγελίας</a></p>
<p style="font-size:14px;line-height:1.6">Χρειάζεσαι κάτι; Απάντησε απλώς σε αυτό το email.<br>${esc(BUSINESS.email)}</p>`
    ),
  });
}
