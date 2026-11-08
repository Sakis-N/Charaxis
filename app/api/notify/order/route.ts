import { NextResponse } from "next/server";
import { notifyOrderCreated } from "@/lib/server/orderNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let id = "";
  try {
    id = String((await req.json()).order_id || "");
  } catch {}
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const r = await notifyOrderCreated(id);
    return NextResponse.json({ ok: true, result: r });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }); // ποτέ μην χαλάς την παραγγελία για ένα email
  }
}
