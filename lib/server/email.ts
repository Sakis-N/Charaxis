// Αποστολή email μέσω Resend REST API (χωρίς npm πακέτο).
// Αν λείπει το RESEND_API_KEY, οι αποστολές παραλείπονται σιωπηλά.
export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string; text?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  const from = process.env.EMAIL_FROM || "Charaxis <onboarding@resend.dev>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? htmlToText(opts.html),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Απλή κειμενική εκδοχή για τα email (βοηθά κατά του spam).
function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<(br|\/p|\/div|\/tr|\/h1|\/li)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c] ?? c);

export function layout(title: string, body: string) {
  return `<!doctype html><html lang="el"><body style="margin:0;background:#F2EEE2;font-family:Arial,Helvetica,sans-serif;color:#1B1714">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="font-size:20px;font-weight:700;margin-bottom:20px">Charaxis</div>
<h1 style="font-size:20px;font-weight:600;margin:0 0 16px">${esc(title)}</h1>
${body}
<div style="margin-top:28px;padding-top:14px;border-top:1px solid #DCD3BF;font-size:12px;color:#8A7A62">Charaxis · Χειροποίητες laser χαράξεις σε ξύλο</div>
</div></body></html>`;
}
