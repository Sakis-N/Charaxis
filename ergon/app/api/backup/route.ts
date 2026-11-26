export const dynamic = "force-dynamic";
import fs from "fs";
import path from "path";
import { db, DATA_DIR } from "@/lib/db";

/** Λήψη αντιγράφου της βάσης (SQLite). Τα αρχεία βρίσκονται στον φάκελο data/files. */
export async function GET() {
  const tmp = path.join(DATA_DIR, `backup-${Date.now()}.db`);
  await db().backup(tmp);
  const buf = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(buf, {
    headers: { "Content-Type": "application/x-sqlite3", "Content-Disposition": `attachment; filename="ergon-${stamp}.db"` },
  });
}
