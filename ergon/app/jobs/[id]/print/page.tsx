import { notFound } from "next/navigation";
import { all } from "@/lib/db";
import { jobList, jobTotal } from "@/lib/data";
import { JOB_STATUS, fmtDate, fmtDateTime, money, num } from "@/lib/util";
import { PrintButton } from "@/components/client";
import { PrintFooter, PrintHeader } from "@/components/PrintHeader";

export default function JobReport({ params, searchParams }: { params: { id: string }; searchParams: { prices?: string; photos?: string; internal?: string } }) {
  const id = Number(params.id);
  const j = jobList("j.id=?", [id])[0];
  if (!j) notFound();
  const showPrices = searchParams.prices !== "0";
  const showPhotos = searchParams.photos !== "0";
  const internal = searchParams.internal === "1";
  const materials = all("SELECT * FROM job_materials WHERE job_id=? ORDER BY id", id);
  const photos = all("SELECT * FROM files WHERE job_id=? AND mime LIKE 'image/%' ORDER BY created_at", id);
  const equipment = j.installation_id ? all("SELECT * FROM equipment WHERE installation_id=?", j.installation_id) : [];
  const t = jobTotal(id);
  const c = all("SELECT * FROM customers WHERE id=?", j.customer_id)[0];
  const opt = (k: string, v: string, label: string) => {
    const p = new URLSearchParams(searchParams as any);
    p.set(k, v);
    return <a href={`?${p}`} className="underline">{label}</a>;
  };
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-gray-900">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3 rounded-lg bg-gray-100 p-3 text-xs">
        <PrintButton />
        <span>Τιμές: {showPrices ? opt("prices", "0", "απόκρυψη") : opt("prices", "1", "εμφάνιση")}</span>
        <span>Φωτογραφίες: {showPhotos ? opt("photos", "0", "απόκρυψη") : opt("photos", "1", "εμφάνιση")}</span>
        <span>Εσωτερικές σημειώσεις: {internal ? opt("internal", "0", "απόκρυψη") : opt("internal", "1", "εμφάνιση")}</span>
        <a href={`/jobs/${id}`} className="ml-auto underline">← Πίσω</a>
      </div>
      <PrintHeader docTitle="Δελτίο εργασίας" docNo={String(j.id)} date={fmtDate(j.completed_at || j.scheduled_at || j.created_at)} />
      <div className="mb-5 grid grid-cols-2 gap-6">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Πελάτης</div>
          <div className="font-semibold">{c.name}</div>
          {c.company && <div>{c.company}</div>}
          {c.afm && <div>ΑΦΜ: {c.afm}</div>}
          {c.phone && <div>Τ: {c.phone}</div>}
          {c.email && <div>{c.email}</div>}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Εγκατάσταση</div>
          <div className="font-semibold">{j.installation_name || "—"}</div>
          <div>{[j.address, j.city].filter(Boolean).join(", ")}</div>
          <div className="mt-2 text-xs text-gray-600">
            Ημ/νία: {fmtDateTime(j.scheduled_at)} · Κατάσταση: {JOB_STATUS[j.status]?.label}
            {j.technician_name && <> · Τεχνικός: {j.technician_name}</>}
          </div>
        </div>
      </div>
      <h2 className="mb-1 text-base font-bold">{j.title}</h2>
      {j.type && <div className="mb-2 text-xs text-gray-600">{j.type}</div>}
      {j.description && <p className="mb-4 whitespace-pre-wrap">{j.description}</p>}
      {j.work_notes && (
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Εργασίες που εκτελέστηκαν</div>
          <p className="whitespace-pre-wrap">{j.work_notes}</p>
        </div>
      )}
      {internal && j.tech_notes && (
        <div className="mb-4 rounded border border-dashed p-2">
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Τεχνικές σημειώσεις</div>
          <p className="whitespace-pre-wrap">{j.tech_notes}</p>
        </div>
      )}
      {equipment.length > 0 && (
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Εξοπλισμός εγκατάστασης</div>
          <ul className="list-inside list-disc">
            {equipment.map((e) => <li key={e.id}>{e.kind} {[e.brand, e.model].filter(Boolean).join(" ")} {e.serial && `(S/N ${e.serial})`}</li>)}
          </ul>
        </div>
      )}
      {(materials.length > 0 || (showPrices && t.labor > 0)) && (
        <table className="mb-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-1">Περιγραφή</th>
              <th className="py-1 text-right">Ποσότητα</th>
              {showPrices && <th className="py-1 text-right">Τιμή</th>}
              {showPrices && <th className="py-1 text-right">Σύνολο</th>}
            </tr>
          </thead>
          <tbody>
            {showPrices && t.labor !== 0 && (
              <tr className="border-b"><td className="py-1">Εργασία</td><td className="py-1 text-right">1</td><td className="py-1 text-right">{money(t.labor)}</td><td className="py-1 text-right">{money(t.labor)}</td></tr>
            )}
            {materials.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-1">{m.name}</td>
                <td className="py-1 text-right">{num(m.qty)} {m.unit}</td>
                {showPrices && <td className="py-1 text-right">{money(m.unit_price)}</td>}
                {showPrices && <td className="py-1 text-right">{money(m.qty * m.unit_price)}</td>}
              </tr>
            ))}
          </tbody>
          {showPrices && (
            <tfoot>
              <tr><td colSpan={3} className="pt-2 text-right font-bold">Σύνολο</td><td className="pt-2 text-right font-bold">{money(t.total)}</td></tr>
            </tfoot>
          )}
        </table>
      )}
      {showPhotos && photos.length > 0 && (
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">Φωτογραφίες</div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={`/api/files/${p.id}`} alt="" className="aspect-[4/3] w-full rounded object-cover" style={{ breakInside: "avoid" }} />
            ))}
          </div>
        </div>
      )}
      <div className="mt-10 grid grid-cols-2 gap-10" style={{ breakInside: "avoid" }}>
        <div>
          <div className="h-24 border-b border-gray-400" />
          <div className="mt-1 text-xs text-gray-600">Ο τεχνικός {j.technician_name ? `(${j.technician_name})` : ""}</div>
        </div>
        <div>
          <div className="flex h-24 items-end border-b border-gray-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {j.signature && <img src={j.signature} alt="" className="max-h-24" />}
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Ο πελάτης {j.signed_by ? `(${j.signed_by}, ${new Date(j.signed_at).toLocaleString("el-GR")})` : ""}
          </div>
        </div>
      </div>
      <PrintFooter />
    </div>
  );
}
