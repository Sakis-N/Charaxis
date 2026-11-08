import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Δημιουργεί Stripe Checkout Session για μια υπάρχουσα παραγγελία.
// Το ποσό διαβάζεται ΠΑΝΤΑ από τη βάση (όχι από τον browser).
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key || !sbUrl || !sbAnon) {
    return NextResponse.json({ error: "Η πληρωμή με κάρτα δεν είναι ενεργή." }, { status: 503 });
  }

  let orderId = "";
  try {
    orderId = String((await req.json()).order_id || "");
  } catch {}
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Μη έγκυρη παραγγελία" }, { status: 400 });
  }

  const r = await fetch(`${sbUrl}/rest/v1/rpc/get_order_public`, {
    method: "POST",
    headers: { apikey: sbAnon, Authorization: `Bearer ${sbAnon}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_order: orderId }),
  });
  const order = await r.json().catch(() => null);
  if (!r.ok || !order || order.payment_provider !== "stripe" || order.payment_status === "paid") {
    return NextResponse.json({ error: "Η παραγγελία δεν μπορεί να πληρωθεί" }, { status: 400 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin;
  const cents = Math.round(Number(order.total) * 100);
  const shortId = orderId.slice(0, 8).toUpperCase();

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/paraggelia/${orderId}`);
  body.set("cancel_url", `${origin}/paraggelia/${orderId}`);
  body.set("client_reference_id", orderId);
  body.set("metadata[order_id]", orderId);
  body.set("payment_intent_data[metadata][order_id]", orderId);
  if (order.customer_email) body.set("customer_email", order.customer_email);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "eur");
  body.set("line_items[0][price_data][unit_amount]", String(cents));
  body.set("line_items[0][price_data][product_data][name]", `Charaxis — Παραγγελία #${shortId}`);
  body.set("locale", "el");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await res.json();
  if (!res.ok || !j.url) {
    return NextResponse.json({ error: "Σφάλμα Stripe" }, { status: 502 });
  }
  return NextResponse.json({ url: j.url });
}
