import { NextResponse } from "next/server";
import { esc, layout, sendEmail } from "@/lib/server/email";
import { hasService, sbService } from "@/lib/server/sb";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ειδοποίηση στον ιδιοκτήτη για νέο μήνυμα επικοινωνίας ή αίτημα προσφοράς.
export async function POST(req: Request) {
  const owner = process.env.ADMIN_NOTIFY_EMAIL;
  let kind = "", id = "";
  try {
    const j = await req.json();
    kind = String(j.kind);
    id = String(j.id);
  } catch {}
  if (!owner || !hasService || !/^[0-9a-f-]{36}$/i.test(id) || !["contact", "quote"].includes(kind)) {
    return NextResponse.json({ ok: false });
  }
  const table = kind === "contact" ? "contact_messages" : "quote_requests";
  const r = await sbService(`${table}?id=eq.${id}&select=*`);
  const row = r.ok ? (await r.json())?.[0] : null;
  if (!row) return NextResponse.json({ ok: false });
  // Αποτροπή επανάληψης: μόνο για εγγραφές των τελευταίων 10 λεπτών.
  if (Date.now() - new Date(row.created_at).getTime() > 10 * 60 * 1000) return NextResponse.json({ ok: false });

  const name = row.name ?? row.customer_name;
  const email = row.email ?? row.customer_email;
  const text = row.message ?? row.description;
  await sendEmail({
    to: owner,
    replyTo: email,
    subject: kind === "contact" ? `✉️ Νέο μήνυμα από ${name}` : `📝 Νέο αίτημα προσφοράς από ${name}`,
    html: layout(
      kind === "contact" ? "Νέο μήνυμα" : "Νέο αίτημα προσφοράς",
      `<p style="font-size:14px"><b>${esc(name)}</b> · ${esc(email)}${row.customer_phone ? ` · ${esc(row.customer_phone)}` : ""}</p>
<p style="font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(text)}</p>
${row.reference_image_url ? `<p style="font-size:13px;color:#8A7A62">📷 Συνημμένη φωτογραφία αναφοράς (στη διαχείριση)</p>` : ""}
<p><a href="${SITE_URL}/admin" style="color:#E2430F">Άνοιγμα διαχείρισης</a> — απάντησε απευθείας σε αυτό το email.</p>`
    ),
  });
  return NextResponse.json({ ok: true });
}
