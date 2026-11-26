import Link from "next/link";
import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { quoteTotals } from "@/lib/data";
import { QUOTE_STATUS, fmtDate, money } from "@/lib/util";
import { Badge, Card, DL, LinkButton, PageHeader, btn } from "@/components/ui";
import { ConfirmForm } from "@/components/client";
import { SignaturePad } from "@/components/SignaturePad";
import { QuoteBody } from "@/components/QuoteBody";
import { clearQuoteSignature, duplicateQuote, quoteToJob, setQuoteStatus, signQuote } from "../../actions";

export default function QuotePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const q = get("SELECT q.*, c.name customer_name, c.email customer_email, i.name installation_name FROM quotes q JOIN customers c ON c.id=q.customer_id LEFT JOIN installations i ON i.id=q.installation_id WHERE q.id=?", id);
  if (!q) notFound();
  const t = quoteTotals(id);
  const mail = q.customer_email
    ? `mailto:${q.customer_email}?subject=${encodeURIComponent(`Προσφορά ${q.number}: ${q.title}`)}&body=${encodeURIComponent(`Καλησπέρα σας,\n\nσας επισυνάπτω την προσφορά ${q.number} για «${q.title}», συνολικού ποσού ${money(t.total)}.\n\nΜε εκτίμηση`)}`
    : null;
  return (
    <>
      <PageHeader
        back={{ href: "/quotes", label: "Προσφορές" }}
        title={`Προσφορά ${q.number}`}
        subtitle={<span className="flex items-center gap-2"><Badge cls={QUOTE_STATUS[q.status]?.cls}>{QUOTE_STATUS[q.status]?.label}</Badge>{q.title}</span>}
        actions={
          <>
            <LinkButton href={`/quotes/${id}/print`} target="_blank">🖨 Εκτύπωση / PDF</LinkButton>
            {mail && <a href={mail} className={btn.secondary}>✉️ Email</a>}
            <LinkButton href={`/quotes/${id}/edit`}>✏️ Επεξεργασία</LinkButton>
            <form action={duplicateQuote}><input type="hidden" name="id" value={id} /><button className={btn.secondary}>⧉ Αντίγραφο</button></form>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Περιεχόμενο">
            <QuoteBody id={id} />
            {q.notes && <p className="mt-4 whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">{q.notes}</p>}
          </Card>
          <Card title="Υπογραφή αποδοχής πελάτη">
            {q.signature ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.signature} alt="" className="h-32 rounded-lg border bg-white" />
                <div className="text-sm text-gray-600">{q.signed_by} · {new Date(q.signed_at).toLocaleString("el-GR")}</div>
                <ConfirmForm action={clearQuoteSignature} message="Διαγραφή υπογραφής;">
                  <input type="hidden" name="id" value={id} />
                  <button className="text-xs text-red-600 hover:underline">Διαγραφή υπογραφής</button>
                </ConfirmForm>
              </div>
            ) : (
              <SignaturePad action={signQuote} id={id} defaultName={q.customer_name} />
            )}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Στοιχεία">
            <DL items={[
              ["Πελάτης", <Link key="c" href={`/customers/${q.customer_id}`} className="text-brand-700">{q.customer_name}</Link>],
              ["Εγκατάσταση", q.installation_name],
              ["Έκδοση", fmtDate(q.issue_date)],
              ["Ισχύει έως", fmtDate(q.valid_until)],
              ["Σύνολο", <b key="t">{money(t.total)}</b>],
              ["Εργασία", q.job_id && <Link key="j" href={`/jobs/${q.job_id}`} className="text-brand-700">Άνοιγμα εργασίας #{q.job_id}</Link>],
            ]} />
          </Card>
          <Card title="Κατάσταση">
            <div className="flex flex-wrap gap-2">
              {Object.entries(QUOTE_STATUS).filter(([k]) => k !== q.status).map(([k, v]) => (
                <form key={k} action={setQuoteStatus}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="status" value={k} />
                  <button className={btn.small}>→ {v.label}</button>
                </form>
              ))}
            </div>
            {!q.job_id && (
              <form action={quoteToJob} className="mt-4">
                <input type="hidden" name="id" value={id} />
                <button className={`${btn.primary} w-full`}>✓ Έγκριση & μετατροπή σε εργασία</button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
