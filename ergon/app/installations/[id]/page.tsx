import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { INSTALLATION_FILE_LIMIT, installationFilesSize, jobList } from "@/lib/data";
import { fmtDate, mapsHref, telHref, today } from "@/lib/util";
import { Card, DL, Empty, LinkButton, PageHeader, inputCls } from "@/components/ui";
import { ConfirmForm, SubmitButton } from "@/components/client";
import { JobList } from "@/components/JobList";
import { FilesCard } from "@/components/Files";
import { MapView } from "@/components/MapView";
import { deleteEquipment, saveEquipment } from "../../actions";

export default function InstallationPage({ params, searchParams }: { params: { id: string }; searchParams: { err?: string; eq?: string } }) {
  const id = Number(params.id);
  const i = get("SELECT i.*, c.name customer_name, c.phone customer_phone FROM installations i JOIN customers c ON c.id=i.customer_id WHERE i.id=?", id);
  if (!i) notFound();
  const here = `/installations/${id}`;
  const equipment = all("SELECT * FROM equipment WHERE installation_id=? ORDER BY kind", id);
  const jobs = jobList("j.installation_id=?", [id], "COALESCE(j.scheduled_at, j.created_at) DESC");
  const files = all("SELECT * FROM files WHERE installation_id=? ORDER BY created_at DESC", id);
  const jobFiles = all("SELECT f.*, j.title job_title FROM files f JOIN jobs j ON j.id=f.job_id WHERE j.installation_id=? ORDER BY f.created_at DESC", id);
  const contracts = all("SELECT * FROM contracts WHERE installation_id=? AND active=1", id);
  const editing = searchParams.eq ? equipment.find((e) => String(e.id) === searchParams.eq) : undefined;
  const t = today();

  return (
    <>
      <PageHeader
        back={{ href: `/customers/${i.customer_id}`, label: i.customer_name }}
        title={`🏢 ${i.name}`}
        subtitle={[i.type, i.address, i.city].filter(Boolean).join(" · ")}
        actions={
          <>
            {mapsHref(i) && <a href={mapsHref(i)} target="_blank" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">🧭 Πλοήγηση</a>}
            {i.customer_phone && <a href={telHref(i.customer_phone)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">📞 {i.customer_name}</a>}
            <LinkButton href={`${here}/edit`}>✏️ Επεξεργασία</LinkButton>
            <LinkButton href={`/jobs/new?customer=${i.customer_id}&installation=${id}`} variant="primary">+ Εργασία</LinkButton>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Στοιχεία">
            <DL
              items={[
                ["Πελάτης", <Link key="c" href={`/customers/${i.customer_id}`} className="text-brand-700">{i.customer_name}</Link>],
                ["Διεύθυνση", [i.address, i.city].filter(Boolean).join(", ")],
                ["Συντεταγμένες", i.lat != null ? `${i.lat}, ${i.lng}` : null],
                ["Συμβόλαια", contracts.map((c) => `${c.title} (επόμενη ${fmtDate(c.next_date)})`).join(", ")],
              ]}
            />
            {i.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-yellow-50 p-3 text-sm">{i.notes}</p>}
          </Card>

          <Card title={`Εξοπλισμός (${equipment.length})`}>
            {equipment.length ? (
              <div className="-mx-4 mb-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-2">Είδος</th>
                      <th className="px-4 py-2">Μάρκα / Μοντέλο</th>
                      <th className="px-4 py-2">S/N</th>
                      <th className="px-4 py-2">Εγκατ.</th>
                      <th className="px-4 py-2">Εγγύηση</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {equipment.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-2 font-medium">
                          {e.kind}
                          {e.notes && <div className="text-xs font-normal text-gray-500">{e.notes}</div>}
                        </td>
                        <td className="px-4 py-2">{[e.brand, e.model].filter(Boolean).join(" ") || "—"}</td>
                        <td className="px-4 py-2 font-mono text-xs">{e.serial || "—"}</td>
                        <td className="px-4 py-2">{fmtDate(e.installed_at)}</td>
                        <td className={`px-4 py-2 ${e.warranty_until && e.warranty_until < t ? "text-red-600" : ""}`}>{fmtDate(e.warranty_until)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <Link href={`${here}?eq=${e.id}#eq-form`} className="mr-2 text-xs text-brand-600">✏️</Link>
                          <ConfirmForm action={deleteEquipment} message="Διαγραφή εξοπλισμού;">
                            <input type="hidden" name="id" value={e.id} />
                            <button className="text-xs text-red-500">✕</button>
                          </ConfirmForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mb-4">
                <Empty>Δεν έχει καταγραφεί εξοπλισμός.</Empty>
              </div>
            )}
            <form id="eq-form" action={saveEquipment} className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-4" key={editing?.id ?? "new"}>
              <div className="col-span-2 text-xs font-semibold text-gray-600 sm:col-span-4">{editing ? "Επεξεργασία εξοπλισμού" : "Προσθήκη εξοπλισμού"}</div>
              <input type="hidden" name="installation_id" value={id} />
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <input name="kind" required placeholder="Είδος (π.χ. Λέβητας)" defaultValue={editing?.kind} className={inputCls} list="eq-kinds" />
              <datalist id="eq-kinds">
                {["Λέβητας", "Καυστήρας", "Αντλία θερμότητας", "Κλιματιστικό", "Ηλιακός", "Θερμοσίφωνας", "Φωτοβολταϊκά", "Inverter", "Πίνακας", "Συναγερμός", "Κάμερα", "Boiler"].map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              <input name="brand" placeholder="Μάρκα" defaultValue={editing?.brand ?? ""} className={inputCls} />
              <input name="model" placeholder="Μοντέλο" defaultValue={editing?.model ?? ""} className={inputCls} />
              <input name="serial" placeholder="Σειριακός" defaultValue={editing?.serial ?? ""} className={inputCls} />
              <label className="text-xs text-gray-500">
                Εγκατάσταση
                <input name="installed_at" type="date" defaultValue={editing?.installed_at ?? ""} className={inputCls} />
              </label>
              <label className="text-xs text-gray-500">
                Εγγύηση έως
                <input name="warranty_until" type="date" defaultValue={editing?.warranty_until ?? ""} className={inputCls} />
              </label>
              <input name="notes" placeholder="Σημειώσεις (πίεση, ρυθμίσεις, κωδικοί…)" defaultValue={editing?.notes ?? ""} className={`${inputCls} col-span-2 self-end`} />
              <div className="col-span-2 flex gap-2 sm:col-span-4">
                <SubmitButton>{editing ? "Αποθήκευση" : "+ Προσθήκη"}</SubmitButton>
                {editing && <LinkButton href={here}>Άκυρο</LinkButton>}
              </div>
            </form>
          </Card>

          <Card title={`Ιστορικό εργασιών (${jobs.length})`}>
            <JobList jobs={jobs} showCustomer={false} empty="Καμία εργασία σε αυτή την εγκατάσταση." />
          </Card>

          <FilesCard
            files={files}
            owner={{ installation_id: id, customer_id: i.customer_id }}
            back={here}
            error={searchParams.err}
            usage={{ used: installationFilesSize(id), limit: INSTALLATION_FILE_LIMIT }}
            title="Αρχεία εγκατάστασης (σχέδια, φωτογραφίες, πιστοποιητικά)"
          />
          {jobFiles.length > 0 && (
            <Card title="Φωτογραφίες από εργασίες">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {jobFiles
                  .filter((f) => String(f.mime).startsWith("image/"))
                  .map((f) => (
                    <a key={f.id} href={`/api/files/${f.id}`} target="_blank" title={f.job_title}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${f.id}`} alt="" className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
                    </a>
                  ))}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          {i.lat != null && i.lng != null ? (
            <MapView points={[{ lat: i.lat, lng: i.lng, title: i.name, sub: i.address }]} height={280} />
          ) : (
            <Empty>
              Δεν έχει οριστεί θέση στον χάρτη. <Link href={`${here}/edit`} className="text-brand-600 underline">Όρισέ τη</Link>
            </Empty>
          )}
        </div>
      </div>
    </>
  );
}
