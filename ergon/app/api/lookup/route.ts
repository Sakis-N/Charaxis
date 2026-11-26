export const dynamic = "force-dynamic";
import { callerInfo } from "@/lib/lookup";
import { fmtDateTime, money } from "@/lib/util";

/**
 * Αναγνώριση κλήσης: GET /api/lookup?phone=69...&key=API_TOKEN[&format=text|json][&log=0]
 * Για χρήση από αυτοματισμό στο κινητό (MacroDroid / Tasker / iOS Shortcuts).
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const phone = u.searchParams.get("phone") || u.searchParams.get("number") || "";
  const info = callerInfo(phone, u.searchParams.get("log") !== "0");
  const origin = process.env.PUBLIC_URL || u.origin;
  if (u.searchParams.get("format") === "json") {
    return Response.json(
      info.found
        ? { found: true, id: info.customer.id, name: info.customer.name, company: info.customer.company, balance: info.balance, next: info.next, last: info.last, url: `${origin}/customers/${info.customer.id}` }
        : { found: false, phone, url: `${origin}/customers/new?phone=${encodeURIComponent(phone)}` },
    );
  }
  let text: string;
  if (!info.found) text = `Άγνωστος: ${phone}`;
  else {
    const c = info.customer;
    const parts = [`📞 ${c.name}${c.company ? ` (${c.company})` : ""}`];
    if (info.installations.length) parts.push(info.installations.map((i: any) => [i.name, i.city].filter(Boolean).join(" ")).join(", "));
    if (info.next) parts.push(`Επόμενο: ${fmtDateTime(info.next.scheduled_at)} ${info.next.title}`);
    if (info.last) parts.push(`Τελευταίο: ${fmtDateTime(info.last.scheduled_at)} ${info.last.title}`);
    if (Math.abs(info.balance) > 0.005) parts.push(`Υπόλοιπο: ${money(info.balance)}`);
    text = parts.join("\n");
  }
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
