import { NextResponse } from "next/server";
import { isAdminToken } from "@/lib/server/sb";
import { createVoucher, voucherPdf } from "@/lib/server/boxnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const auth = (req: Request) => (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") || null;
const okId = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

// Δημιουργία voucher.
export async function POST(req: Request) {
  if (!(await isAdminToken(auth(req)))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let id = "";
  let size = 0;
  try { const j = await req.json(); id = String(j.order_id); size = Number(j.size); } catch {}
  if (!okId(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await createVoucher(id, size)) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Σφάλμα" }, { status: 502 });
  }
}

// Λήψη voucher PDF.
export async function GET(req: Request) {
  if (!(await isAdminToken(auth(req)))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("order_id") || "";
  if (!okId(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  try {
    const pdf = await voucherPdf(id);
    return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="boxnow-${id.slice(0, 8)}.pdf"` } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Σφάλμα" }, { status: 502 });
  }
}
