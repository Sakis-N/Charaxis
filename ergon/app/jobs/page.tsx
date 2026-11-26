import Link from "next/link";
import { all } from "@/lib/db";
import { jobList } from "@/lib/data";
import { JOB_STATUS, today } from "@/lib/util";
import { Badge, Card, LinkButton, PageHeader, inputCls } from "@/components/ui";
import { JobList } from "@/components/JobList";

export default function Jobs({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const sp = searchParams;
  const where: string[] = ["1=1"];
  const params: any[] = [];
  const t = today();
  const status = sp.status || "open";
  if (status === "open") where.push("j.status IN ('pending','scheduled','in_progress')");
  else if (status === "overdue") {
    where.push("j.status IN ('pending','scheduled','in_progress') AND substr(j.scheduled_at,1,10) < ?");
    params.push(t);
  } else if (status !== "all") {
    where.push("j.status=?");
    params.push(status);
  }
  if (sp.tech) { where.push("j.technician_id=?"); params.push(Number(sp.tech)); }
  if (sp.crew) { where.push("j.crew_id=?"); params.push(Number(sp.crew)); }
  if (sp.from) { where.push("substr(j.scheduled_at,1,10) >= ?"); params.push(sp.from); }
  if (sp.to) { where.push("substr(j.scheduled_at,1,10) <= ?"); params.push(sp.to); }
  if (sp.q) {
    where.push("(j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ? OR i.name LIKE ? OR j.type LIKE ? OR j.work_notes LIKE ?)");
    const l = `%${sp.q}%`;
    params.push(l, l, l, l, l, l);
  }
  const order = status === "done" || status === "all" ? "COALESCE(j.scheduled_at, j.created_at) DESC" : "j.scheduled_at IS NULL, j.scheduled_at";
  const jobs = jobList(where.join(" AND "), params, order, 300);
  const techs = all("SELECT id, name FROM technicians ORDER BY name");
  const crews = all("SELECT id, name FROM crews ORDER BY name");
  const tabs: [string, string][] = [["open", "Ανοιχτές"], ["overdue", "Εκπρόθεσμες"], ["pending", JOB_STATUS.pending.label], ["scheduled", JOB_STATUS.scheduled.label], ["in_progress", JOB_STATUS.in_progress.label], ["done", JOB_STATUS.done.label], ["cancelled", JOB_STATUS.cancelled.label], ["all", "Όλες"]];
  const qs = (s: string) => {
    const p = new URLSearchParams(Object.entries({ ...sp, status: s }).filter(([, v]) => v) as [string, string][]);
    return `/jobs?${p.toString()}`;
  };
  return (
    <>
      <PageHeader title="Εργασίες" subtitle={`${jobs.length} αποτελέσματα`} actions={<><LinkButton href={`/api/export/jobs`}>⬇ CSV</LinkButton><LinkButton href="/jobs/new" variant="primary">+ Νέα εργασία</LinkButton></>} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map(([k, l]) => (
          <Link key={k} href={qs(k)}>
            <Badge cls={status === k ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-700"}>{l}</Badge>
          </Link>
        ))}
      </div>
      <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={sp.q} placeholder="Αναζήτηση…" className={`${inputCls} col-span-2`} />
        <select name="tech" defaultValue={sp.tech || ""} className={inputCls}>
          <option value="">Όλοι οι τεχνικοί</option>
          {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select name="crew" defaultValue={sp.crew || ""} className={inputCls}>
          <option value="">Όλα τα συνεργεία</option>
          {crews.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className={inputCls} title="Από" />
        <input type="date" name="to" defaultValue={sp.to} className={inputCls} title="Έως" />
        <button className="col-span-2 rounded-lg bg-gray-800 py-2 text-sm text-white sm:col-span-1">Φίλτρο</button>
      </form>
      <Card>
        <JobList jobs={jobs} empty="Δεν βρέθηκαν εργασίες." />
      </Card>
    </>
  );
}
