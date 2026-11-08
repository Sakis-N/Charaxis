import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verify(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    })
  );
  const t = parts["t"];
  const sig = parts["v1"];
  if (!t || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !sbUrl || !service) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verify(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object;
    const orderId = s.metadata?.order_id || s.client_reference_id;
    if (s.payment_status === "paid" && /^[0-9a-f-]{36}$/i.test(orderId || "")) {
      const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
      // Επιβεβαίωση ότι το ποσό που πληρώθηκε ταιριάζει με την παραγγελία.
      const o = await fetch(`${sbUrl}/rest/v1/orders?id=eq.${orderId}&select=total`, { headers }).then((r) => r.json());
      const expected = Math.round(Number(o?.[0]?.total) * 100);
      if (expected && expected === s.amount_total) {
        await fetch(`${sbUrl}/rest/v1/orders?id=eq.${orderId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ payment_status: "paid" }),
        });
      }
    }
  }
  return NextResponse.json({ received: true });
}
