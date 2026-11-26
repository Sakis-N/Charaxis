import Link from "next/link";
import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { JOB_TOTAL_SQL, jobList } from "@/lib/data";
import { PROJECT_STATUS, fmtDate, money } from "@/lib/util";
import { Badge, Card, DL, LinkButton, PageHeader, Stat } from "@/components/ui";
import { JobList } from "@/components/JobList";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const p = get("SELECT p.*, c.name customer_name, i.name installation_name FROM projects p JOIN customers c ON c.id=p.customer_id LEFT JOIN installations i ON i.id=p.installation_id WHERE p.id=?", id);
  if (!p) notFound();
  const jobs = jobList("j.project_id=?", [id], "j.scheduled_at IS NULL, j.scheduled_at");
  const value = get(`SELECT COALESCE(SUM(${JOB_TOTAL_SQL}),0) v FROM jobs j WHERE j.project_id=? AND j.status!='cancelled'`, id)!.v;
  const cost = get("SELECT COALESCE(SUM(m.qty*m.unit_cost),0) c FROM job_materials m JOIN jobs j ON j.id=m.job_id WHERE j.project_id=?", id)!.c
    + get("SELECT COALESCE(SUM(e.amount),0) c FROM expenses e JOIN jobs j ON j.id=e.job_id WHERE j.project_id=?", id)!.c;
  const paid = get("SELECT COALESCE(SUM(p.amount),0) s FROM payments p JOIN jobs j ON j.id=p.job_id WHERE j.project_id=?", id)!.s;
  const done = jobs.filter((j) => j.status === "done").length;
  return (
    <>
      <PageHeader
        back={{ href: "/projects", label: "Έργα" }}
        title={`📁 ${p.name}`}
        subtitle={<Badge cls={PROJECT_STATUS[p.status]?.cls}>{PROJECT_STATUS[p.status]?.label}</Badge>}
        actions={<><LinkButton href={`/projects/${id}/edit`}>✏️ Επεξεργασία</LinkButton><LinkButton href={`/jobs/new?project=${id}&customer=${p.customer_id}${p.installation_id ? `&installation=${p.installation_id}` : ""}`} variant="primary">+ Εργασία στο έργο</LinkButton></>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Πρόοδος" value={`${jobs.length ? Math.round((done / jobs.length) * 100) : 0}%`} sub={`${done}/${jobs.length} εργασίες`} />
        <Stat label="Αξία εργασιών" value={money(value)} sub={p.budget ? `προϋπ. ${money(p.budget)}` : undefined} />
        <Stat label="Κόστος (υλικά+έξοδα)" value={money(cost)} sub={`κέρδος ${money(value - cost)}`} />
        <Stat label="Εισπράξεις" value={money(paid)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Εργασίες έργου" className="lg:col-span-2"><JobList jobs={jobs} showCustomer={false} empty="Καμία εργασία ακόμα." /></Card>
        <Card title="Στοιχεία">
          <DL items={[
            ["Πελάτης", <Link key="c" href={`/customers/${p.customer_id}`} className="text-brand-700">{p.customer_name}</Link>],
            ["Εγκατάσταση", p.installation_name && <Link key="i" href={`/installations/${p.installation_id}`} className="text-brand-700">{p.installation_name}</Link>],
            ["Έναρξη", fmtDate(p.start_date)],
            ["Λήξη", fmtDate(p.end_date)],
            ["Προϋπολογισμός", p.budget ? money(p.budget) : null],
          ]} />
          {p.description && <p className="mt-3 whitespace-pre-wrap text-sm">{p.description}</p>}
        </Card>
      </div>
    </>
  );
}
