import { getSettings } from "@/lib/db";

export function PrintHeader({ docTitle, docNo, date }: { docTitle: string; docNo?: string; date?: string }) {
  const s = getSettings();
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-gray-800 pb-4">
      <div>
        <div className="text-xl font-bold">{s.business_name || "Η επιχείρησή μου"}</div>
        <div className="text-xs leading-relaxed text-gray-600">
          {s.business_owner && <div>{s.business_owner}</div>}
          {s.business_address && <div>{s.business_address}</div>}
          {[s.business_phone && `Τ: ${s.business_phone}`, s.business_email].filter(Boolean).join(" · ")}
          {(s.business_afm || s.business_doy) && <div>ΑΦΜ {s.business_afm} {s.business_doy && `· ΔΟΥ ${s.business_doy}`}</div>}
          {s.business_website && <div>{s.business_website}</div>}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold uppercase tracking-wide">{docTitle}</div>
        {docNo && <div className="text-sm">Αρ. {docNo}</div>}
        {date && <div className="text-sm text-gray-600">{date}</div>}
      </div>
    </div>
  );
}

export function PrintFooter() {
  const s = getSettings();
  return s.report_footer ? <div className="mt-10 border-t pt-3 text-center text-xs text-gray-500 whitespace-pre-wrap">{s.report_footer}</div> : null;
}
