export const dynamic = "force-dynamic";
import { all, getSetting } from "@/lib/db";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

/** Εξαγωγή πελατών ως vCard για εισαγωγή/συγχρονισμό στις επαφές του κινητού. ?customer=ID για έναν. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const one = u.searchParams.get("customer");
  const rows = one ? all("SELECT * FROM customers WHERE id=?", Number(one)) : all("SELECT * FROM customers ORDER BY name");
  const label = getSetting("business_name", "Ergon");
  const cards = rows.map((c) => {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `UID:ergon-customer-${c.id}`,
      `FN:${esc(c.name)}`,
      `N:${esc(c.name)};;;;`,
      c.company ? `ORG:${esc(c.company)}` : "",
      c.phone ? `TEL;TYPE=CELL:${c.phone}` : "",
      c.phone2 ? `TEL;TYPE=WORK:${c.phone2}` : "",
      c.email ? `EMAIL:${c.email}` : "",
      c.address || c.city ? `ADR;TYPE=WORK:;;${esc(c.address || "")};${esc(c.city || "")};;;` : "",
      `NOTE:${esc(`Πελάτης ${label}${c.afm ? ` · ΑΦΜ ${c.afm}` : ""}${c.notes ? `\n${c.notes}` : ""}`)}`,
      `CATEGORIES:${esc(label)}`,
      `REV:${new Date().toISOString()}`,
      "END:VCARD",
    ];
    return lines.filter(Boolean).join("\r\n");
  });
  return new Response(cards.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${one ? `customer-${one}` : "pelates"}.vcf"`,
    },
  });
}
