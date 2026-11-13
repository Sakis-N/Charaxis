// Καθημερινά: σβήνει τις φωτογραφίες πελατών 5 μέρες μετά την ολοκλήρωση της παραγγελίας.
// Τρέχει μόνο στο production deploy (scheduled function). Χρησιμοποιεί μόνο μεταβλητές που ήδη υπάρχουν.
export const config = { schedule: "0 1 * * *" };

const DAYS = 5;

export default async function handler() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Response("not configured", { status: 200 });
  const headers = {
    apikey: key,
    // Τα νέα κλειδιά (sb_secret_…) δεν είναι JWT και δεν στέλνονται ως Bearer.
    ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
    "Content-Type": "application/json",
  };
  const cutoff = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
  const r = await fetch(
    `${url}/rest/v1/orders?status=eq.completed&photos_deleted_at=is.null&completed_at=lt.${encodeURIComponent(cutoff)}&select=id,order_items(custom_design)`,
    { headers }
  );
  if (!r.ok) return new Response("query failed " + r.status, { status: 200 });
  const orders = await r.json();
  let deleted = 0;
  for (const o of orders) {
    const paths = [];
    for (const it of o.order_items || []) for (const p of it.custom_design?.photos || []) if (p?.path) paths.push(p.path);
    if (paths.length) {
      const d = await fetch(`${url}/storage/v1/object/customer-uploads`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ prefixes: paths }),
      });
      if (!d.ok) continue; // θα ξαναδοκιμάσει αύριο
      deleted += paths.length;
    }
    await fetch(`${url}/rest/v1/orders?id=eq.${o.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ photos_deleted_at: new Date().toISOString() }),
    });
  }
  return new Response(`ok orders=${orders.length} files=${deleted}`, { status: 200 });
}
