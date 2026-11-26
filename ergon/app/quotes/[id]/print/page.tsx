import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { fmtDate } from "@/lib/util";
import { PrintButton } from "@/components/client";
import { PrintFooter, PrintHeader } from "@/components/PrintHeader";
import { QuoteBody } from "@/components/QuoteBody";

export default function QuotePrint({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const q = get("SELECT q.*, i.name installation_name, i.address inst_address, i.city inst_city FROM quotes q LEFT JOIN installations i ON i.id=q.installation_id WHERE q.id=?", id);
  if (!q) notFound();
  const c = get("SELECT * FROM customers WHERE id=?", q.customer_id)!;
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-gray-900">
      <div className="no-print mb-6 flex items-center gap-3 rounded-lg bg-gray-100 p-3 text-xs">
        <PrintButton />
        <span>Στο παράθυρο εκτύπωσης διάλεξε «Αποθήκευση ως PDF».</span>
        <a href={`/quotes/${id}`} className="ml-auto underline">← Πίσω</a>
      </div>
      <PrintHeader docTitle="Προσφορά" docNo={q.number} date={fmtDate(q.issue_date)} />
      <div className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Προς</div>
          <div className="font-semibold">{c.name}</div>
          {c.company && <div>{c.company}</div>}
          {c.afm && <div>ΑΦΜ: {c.afm}</div>}
          {[c.address, c.city].filter(Boolean).length > 0 && <div>{[c.address, c.city].filter(Boolean).join(", ")}</div>}
          {c.phone && <div>Τ: {c.phone}</div>}
        </div>
        <div>
          {q.installation_name && (
            <>
              <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Τόπος εργασίας</div>
              <div>{q.installation_name}</div>
              <div>{[q.inst_address, q.inst_city].filter(Boolean).join(", ")}</div>
            </>
          )}
          {q.valid_until && <div className="mt-2 text-xs text-gray-600">Ισχύς προσφοράς έως: <b>{fmtDate(q.valid_until)}</b></div>}
        </div>
      </div>
      <h2 className="mb-3 text-base font-bold">{q.title}</h2>
      <QuoteBody id={id} />
      {q.notes && <div className="mt-6 whitespace-pre-wrap">{q.notes}</div>}
      {q.terms && (
        <div className="mt-6" style={{ breakInside: "avoid" }}>
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Όροι</div>
          <div className="whitespace-pre-wrap text-xs text-gray-700">{q.terms}</div>
        </div>
      )}
      <div className="mt-10 grid grid-cols-2 gap-10" style={{ breakInside: "avoid" }}>
        <div><div className="h-24 border-b border-gray-400" /><div className="mt-1 text-xs text-gray-600">Για την επιχείρηση</div></div>
        <div>
          <div className="flex h-24 items-end border-b border-gray-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {q.signature && <img src={q.signature} alt="" className="max-h-24" />}
          </div>
          <div className="mt-1 text-xs text-gray-600">Αποδοχή πελάτη {q.signed_by ? `(${q.signed_by}, ${new Date(q.signed_at).toLocaleDateString("el-GR")})` : ""}</div>
        </div>
      </div>
      <PrintFooter />
    </div>
  );
}
