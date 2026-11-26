import Link from "next/link";
import { notFound } from "next/navigation";
import { all } from "@/lib/db";
import { jobList, jobTotal, selectOptions } from "@/lib/data";
import { JOB_STATUS, PAYMENT_METHODS, PRIORITY, fmtDateLong, fmtDateTime, mapsHref, money, num, telHref, today } from "@/lib/util";
import { Badge, Card, DL, Dot, Empty, LinkButton, PageHeader, btn, inputCls } from "@/components/ui";
import { ConfirmForm, MaterialLine, SubmitButton } from "@/components/client";
import { SignaturePad } from "@/components/SignaturePad";
import { FilesCard } from "@/components/Files";
import {
  addJobMaterial,
  clearJobSignature,
  deleteJobMaterial,
  duplicateJob,
  rescheduleJob,
  saveJobNotes,
  savePayment,
  saveReminder,
  setJobStatusAction,
  signJob,
} from "../../actions";

const FLOW: Record<string, { to: string; label: string; cls: string }[]> = {
  pending: [{ to: "in_progress", label: "▶ Έναρξη", cls: btn.secondary }, { to: "done", label: "✓ Ολοκλήρωση", cls: btn.primary }],
  scheduled: [{ to: "in_progress", label: "▶ Έναρξη", cls: btn.secondary }, { to: "done", label: "✓ Ολοκλήρωση", cls: btn.primary }],
  in_progress: [{ to: "done", label: "✓ Ολοκλήρωση", cls: btn.primary }],
  done: [{ to: "in_progress", label: "↺ Επαναφορά", cls: btn.secondary }],
  cancelled: [{ to: "pending", label: "↺ Επαναφορά", cls: btn.secondary }],
};

export default function JobPage({ params, searchParams }: { params: { id: string }; searchParams: { err?: string } }) {
  const id = Number(params.id);
  const j = jobList("j.id=?", [id])[0];
  if (!j) notFound();
  const here = `/jobs/${id}`;
  const materials = all("SELECT * FROM job_materials WHERE job_id=? ORDER BY id", id);
  const files = all("SELECT * FROM files WHERE job_id=? ORDER BY created_at DESC", id);
  const payments = all("SELECT * FROM payments WHERE job_id=? ORDER BY date", id);
  const totals = jobTotal(id);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const o = selectOptions();
  const project = j.project_id ? all("SELECT id, name FROM projects WHERE id=?", j.project_id)[0] : null;
  const prev = j.installation_id ? jobList("j.installation_id=? AND j.id!=? AND j.status='done'", [j.installation_id, id], "j.scheduled_at DESC", 5) : [];
  const date = j.scheduled_at ? String(j.scheduled_at).slice(0, 10) : "";
  const time = j.scheduled_at ? String(j.scheduled_at).slice(11, 16) : "09:00";

  return (
    <>
      <PageHeader
        back={{ href: `/customers/${j.customer_id}`, label: j.customer_name }}
        title={j.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge cls={JOB_STATUS[j.status]?.cls}>{JOB_STATUS[j.status]?.label}</Badge>
            <Badge cls={PRIORITY[j.priority]?.cls}>{PRIORITY[j.priority]?.label}</Badge>
            {j.type && <Badge>{j.type}</Badge>}
            <span>#{j.id}</span>
            {j.scheduled_at && <span>📅 {fmtDateLong(j.scheduled_at)} {String(j.scheduled_at).slice(11, 16)}</span>}
          </span>
        }
        actions={
          <>
            {(FLOW[j.status] || []).map((f) => (
              <form key={f.to} action={setJobStatusAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={f.to} />
                <button className={f.cls}>{f.label}</button>
              </form>
            ))}
            <LinkButton href={`${here}/print`} target="_blank">🧾 Αναφορά</LinkButton>
            <LinkButton href={`${here}/edit`}>✏️ Επεξεργασία</LinkButton>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Λεπτομέρειες">
            <DL
              items={[
                ["Πελάτης", <Link key="c" href={`/customers/${j.customer_id}`} className="text-brand-700">{j.customer_name}</Link>],
                ["Τηλέφωνο", j.customer_phone && <a href={telHref(j.customer_phone)} className="text-brand-700">📞 {j.customer_phone}</a>],
                ["Εγκατάσταση", j.installation_name && <Link key="i" href={`/installations/${j.installation_id}`} className="text-brand-700">{j.installation_name}</Link>],
                ["Διεύθυνση", j.address && <a href={mapsHref(j)} target="_blank" className="text-brand-700">🧭 {[j.address, j.city].filter(Boolean).join(", ")}</a>],
                ["Έργο", project && <Link key="p" href={`/projects/${project.id}`} className="text-brand-700">{project.name}</Link>],
                ["Τεχνικός", j.technician_name && <span className="inline-flex items-center gap-1.5"><Dot color={j.technician_color} />{j.technician_name}</span>],
                ["Συνεργείο", j.crew_name && <span className="inline-flex items-center gap-1.5"><Dot color={j.crew_color} />{j.crew_name}</span>],
                ["Διάρκεια", j.duration_min ? `${j.duration_min} λεπτά` : null],
                ["Συμβόλαιο", j.contract_id && <Link key="k" href={`/contracts?edit=${j.contract_id}`} className="text-brand-700">🔁 Επαναλαμβανόμενη συντήρηση</Link>],
                ["Ολοκληρώθηκε", j.completed_at && fmtDateTime(j.completed_at)],
                ["Καταχωρήθηκε", fmtDateTime(j.created_at)],
              ]}
            />
            {j.description && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">{j.description}</p>}
          </Card>

          <Card title="Σημειώσεις εργασίας">
            <form action={saveJobNotes} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Τι έγινε (εμφανίζεται στην αναφορά πελάτη)</span>
                <textarea name="work_notes" rows={4} defaultValue={j.work_notes ?? ""} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Τεχνικές σημειώσεις (εσωτερικές: μετρήσεις, ρυθμίσεις, κωδικοί)</span>
                <textarea name="tech_notes" rows={3} defaultValue={j.tech_notes ?? ""} className={inputCls} />
              </label>
              <SubmitButton>Αποθήκευση σημειώσεων</SubmitButton>
            </form>
          </Card>

          <Card title="Υλικά & χρεώσεις">
            {materials.length > 0 ? (
              <div className="-mx-4 mb-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-2">Περιγραφή</th>
                      <th className="px-4 py-2 text-right">Ποσ.</th>
                      <th className="px-4 py-2 text-right">Τιμή</th>
                      <th className="px-4 py-2 text-right">Σύνολο</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-1.5">{m.name}{m.material_id ? <span className="ml-1 text-xs text-gray-400">(αποθήκη)</span> : null}</td>
                        <td className="px-4 py-1.5 text-right">{num(m.qty)} {m.unit}</td>
                        <td className="px-4 py-1.5 text-right">{money(m.unit_price)}</td>
                        <td className="px-4 py-1.5 text-right">{money(m.qty * m.unit_price)}</td>
                        <td className="px-4 py-1.5 text-right">
                          <ConfirmForm action={deleteJobMaterial} message="Αφαίρεση υλικού; (επιστρέφει στην αποθήκη)">
                            <input type="hidden" name="id" value={m.id} />
                            <button className="text-xs text-red-500">✕</button>
                          </ConfirmForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mb-3 text-sm text-gray-500">Δεν έχουν προστεθεί υλικά.</p>
            )}
            <form action={addJobMaterial} className="space-y-2 rounded-lg bg-gray-50 p-3">
              <input type="hidden" name="job_id" value={id} />
              <MaterialLine materials={o.materials as any} />
              <SubmitButton variant="secondary">+ Προσθήκη υλικού</SubmitButton>
            </form>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Εργασία</span><span>{money(totals.labor)}</span></div>
              <div className="flex justify-between"><span>Υλικά</span><span>{money(totals.materials)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Σύνολο</span><span>{money(totals.total)}</span></div>
              {totals.cost > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Κόστος υλικών / κέρδος υλικών</span><span>{money(totals.cost)} / {money(totals.materials - totals.cost)}</span></div>}
              <div className="flex justify-between text-green-700"><span>Πληρώθηκαν</span><span>{money(paid)}</span></div>
              <div className={`flex justify-between font-semibold ${totals.total - paid > 0.005 ? "text-amber-700" : "text-gray-500"}`}><span>Υπόλοιπο εργασίας</span><span>{money(totals.total - paid)}</span></div>
            </div>
          </Card>

          <FilesCard files={files} owner={{ job_id: id, customer_id: j.customer_id }} back={here} error={searchParams.err} />

          <Card title="Υπογραφή πελάτη">
            {j.signature ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={j.signature} alt="Υπογραφή" className="h-32 rounded-lg border bg-white" />
                <div className="text-sm text-gray-600">
                  {j.signed_by} · {new Date(j.signed_at).toLocaleString("el-GR")}
                </div>
                <ConfirmForm action={clearJobSignature} message="Διαγραφή υπογραφής;">
                  <input type="hidden" name="id" value={id} />
                  <button className="text-xs text-red-600 hover:underline">Διαγραφή υπογραφής</button>
                </ConfirmForm>
              </div>
            ) : (
              <SignaturePad action={signJob} id={id} defaultName={j.customer_name} />
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Προγραμματισμός">
            <form action={rescheduleJob} className="space-y-2">
              <input type="hidden" name="id" value={id} />
              <div className="flex gap-2">
                <input type="date" name="date" defaultValue={date} className={inputCls} />
                <input type="time" name="time" defaultValue={time} className={`${inputCls} w-28`} />
              </div>
              <SubmitButton variant="secondary" className="w-full">📅 Αλλαγή ημ/νίας</SubmitButton>
            </form>
          </Card>

          <Card title="Πληρωμή για την εργασία">
            <form action={savePayment} className="space-y-2">
              <input type="hidden" name="customer_id" value={j.customer_id} />
              <input type="hidden" name="job_id" value={id} />
              <input type="hidden" name="_back" value={here} />
              <div className="flex gap-2">
                <input key={`amt-${totals.total}-${paid}`} name="amount" required inputMode="decimal" placeholder="€" defaultValue={totals.total - paid > 0 ? (totals.total - paid).toFixed(2) : ""} className={inputCls} />
                <select name="method" className={inputCls}>
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <input name="date" type="date" defaultValue={today()} className={inputCls} />
              <SubmitButton className="w-full">💶 Καταχώρηση πληρωμής</SubmitButton>
            </form>
            {payments.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex justify-between"><span>{p.date.split("-").reverse().join("/")} · {p.method}</span><b>{money(p.amount)}</b></li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Υπενθύμιση">
            <form action={saveReminder} className="space-y-2">
              <input type="hidden" name="customer_id" value={j.customer_id} />
              <input type="hidden" name="job_id" value={id} />
              <input type="hidden" name="_back" value={here} />
              <input name="title" required defaultValue={`Επόμενη επίσκεψη: ${j.title}`} className={inputCls} />
              <input name="due_date" type="date" required className={inputCls} />
              <SubmitButton variant="secondary" className="w-full">⏰ Προσθήκη</SubmitButton>
            </form>
          </Card>

          <Card title="Ενέργειες">
            <div className="flex flex-col gap-2">
              <form action={duplicateJob}>
                <input type="hidden" name="id" value={id} />
                <button className={`${btn.secondary} w-full`}>⧉ Αντιγραφή σε νέα εργασία</button>
              </form>
              {j.status !== "cancelled" && j.status !== "done" && (
                <form action={setJobStatusAction}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className={`${btn.danger} w-full`}>Ακύρωση εργασίας</button>
                </form>
              )}
            </div>
          </Card>

          <Card title="Προηγούμενες επισκέψεις">
            {prev.length ? (
              <ul className="space-y-2 text-sm">
                {prev.map((p) => (
                  <li key={p.id}>
                    <Link href={`/jobs/${p.id}`} className="hover:underline">{p.title}</Link>
                    <div className="text-xs text-gray-500">{fmtDateTime(p.scheduled_at)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>—</Empty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
