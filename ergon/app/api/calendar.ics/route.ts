export const dynamic = "force-dynamic";
import { jobList } from "@/lib/data";
import { addDays, today } from "@/lib/util";

const esc = (s: string) => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
const dt = (s: string) => s.replace(/[-:]/g, "").slice(0, 13) + "00";

/** Ημερολόγιο ραντεβού σε μορφή iCal — συνδρομή από Google/Apple Calendar. ?tech=ID για ένα τεχνικό. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const tech = u.searchParams.get("tech");
  const origin = process.env.PUBLIC_URL || u.origin;
  const where = ["j.scheduled_at IS NOT NULL", "j.status!='cancelled'", "substr(j.scheduled_at,1,10) >= ?"];
  const params: any[] = [addDays(today(), -60)];
  if (tech) { where.push("j.technician_id=?"); params.push(Number(tech)); }
  const jobs = jobList(where.join(" AND "), params, "j.scheduled_at", 5000);
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ev = jobs.map((j) => {
    const start = String(j.scheduled_at);
    const end = new Date(new Date(start + ":00Z").getTime() + (j.duration_min || 60) * 60000).toISOString().slice(0, 16);
    return [
      "BEGIN:VEVENT",
      `UID:ergon-job-${j.id}@ergon`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Athens:${dt(start)}`,
      `DTEND;TZID=Europe/Athens:${dt(end)}`,
      `SUMMARY:${esc(`${j.status === "done" ? "✓ " : ""}${j.customer_name}: ${j.title}`)}`,
      `LOCATION:${esc([j.address, j.city].filter(Boolean).join(", "))}`,
      `DESCRIPTION:${esc(`${j.description || ""}\nΤηλ: ${j.customer_phone || "-"}\n${origin}/jobs/${j.id}`)}`,
      `URL:${origin}/jobs/${j.id}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ergon//GR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Ergon ραντεβού",
    "X-WR-TIMEZONE:Europe/Athens",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Athens",
    "BEGIN:STANDARD\r\nDTSTART:19701025T040000\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\nTZOFFSETFROM:+0300\r\nTZOFFSETTO:+0200\r\nEND:STANDARD",
    "BEGIN:DAYLIGHT\r\nDTSTART:19700329T030000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0300\r\nEND:DAYLIGHT",
    "END:VTIMEZONE",
    ...ev,
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body + "\r\n", { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
}
