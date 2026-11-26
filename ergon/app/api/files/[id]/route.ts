export const dynamic = "force-dynamic";
import fs from "fs";
import path from "path";
import { get, FILES_DIR } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const f = get("SELECT * FROM files WHERE id=?", Number(params.id));
  if (!f) return new Response("Not found", { status: 404 });
  const p = path.join(FILES_DIR, path.basename(f.stored_name));
  if (!fs.existsSync(p)) return new Response("Missing", { status: 404 });
  const inline = /^(image\/|application\/pdf|text\/)/.test(f.mime || "");
  return new Response(fs.readFileSync(p), {
    headers: {
      "Content-Type": f.mime || "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.filename)}`,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
