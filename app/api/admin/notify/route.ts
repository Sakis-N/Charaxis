import { NextResponse } from "next/server";
import { isAdminToken } from "@/lib/server/sb";
import { notifyOrderPaid, notifyOrderShipped, notifyOrderStarted } from "@/lib/server/orderNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") || null;
  if (!(await isAdminToken(token))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let id = "", kind = "";
  try {
    const j = await req.json();
    id = String(j.order_id);
    kind = String(j.kind);
  } catch {}
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  if (kind === "shipped") await notifyOrderShipped(id);
  else if (kind === "started") await notifyOrderStarted(id);
  else if (kind === "paid") await notifyOrderPaid(id);
  else return NextResponse.json({ error: "bad kind" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
