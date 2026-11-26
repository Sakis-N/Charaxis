import Link from "next/link";
import { all } from "@/lib/db";
import { JOB_TOTAL_SQL } from "@/lib/data";
import { PROJECT_STATUS, fmtDate, money } from "@/lib/util";
import { Badge, Card, Empty, LinkButton, PageHeader, Table, Td } from "@/components/ui";

export default function Projects({ searchParams }: { searchParams: { status?: string } }) {
  const st = searchParams.status;
  const rows = all(
    `SELECT p.*, c.name customer_name,
      (SELECT COUNT(*) FROM jobs j WHERE j.project_id=p.id) jobs,
      (SELECT COUNT(*) FROM jobs j WHERE j.project_id=p.id AND j.status='done') jobs_done,
      COALESCE((SELECT SUM(${JOB_TOTAL_SQL}) FROM jobs j WHERE j.project_id=p.id AND j.status!='cancelled'),0) value
     FROM projects p JOIN customers c ON c.id=p.customer_id ${st ? "WHERE p.status=?" : ""}
     ORDER BY p.status='active' DESC, p.created_at DESC`,
    ...(st ? [st] : []),
  );
  return (
    <>
      <PageHeader title="Έργα" subtitle="Ομαδοποίηση πολλών εργασιών (π.χ. ανακαίνιση, νέα εγκατάσταση)" actions={<LinkButton href="/projects/new" variant="primary">+ Νέο έργο</LinkButton>} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Link href="/projects"><Badge cls={!st ? "bg-brand-600 text-white" : "bg-white border border-gray-200"}>Όλα</Badge></Link>
        {Object.entries(PROJECT_STATUS).map(([k, v]) => (
          <Link key={k} href={`/projects?status=${k}`}><Badge cls={st === k ? "bg-brand-600 text-white" : "bg-white border border-gray-200"}>{v.label}</Badge></Link>
        ))}
      </div>
      <Card>
        {rows.length ? (
          <Table head={["Έργο", "Πελάτης", "Πρόοδος", "Αξία / Προϋπ.", "Διάρκεια", "Κατάσταση"]}>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <Td><Link href={`/projects/${p.id}`} className="font-medium text-brand-700 hover:underline">📁 {p.name}</Link></Td>
                <Td>{p.customer_name}</Td>
                <Td>
                  <div className="h-1.5 w-24 overflow-hidden rounded bg-gray-100"><div className="h-full bg-green-500" style={{ width: `${p.jobs ? (p.jobs_done / p.jobs) * 100 : 0}%` }} /></div>
                  <div className="text-xs text-gray-500">{p.jobs_done}/{p.jobs} εργασίες</div>
                </Td>
                <Td>{money(p.value)}{p.budget ? <span className="text-xs text-gray-500"> / {money(p.budget)}</span> : null}</Td>
                <Td className="text-xs">{fmtDate(p.start_date)} – {fmtDate(p.end_date)}</Td>
                <Td><Badge cls={PROJECT_STATUS[p.status]?.cls}>{PROJECT_STATUS[p.status]?.label}</Badge></Td>
              </tr>
            ))}
          </Table>
        ) : <Empty>Κανένα έργο.</Empty>}
      </Card>
    </>
  );
}
