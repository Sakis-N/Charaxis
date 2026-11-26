import Link from "next/link";
import { all } from "@/lib/db";
import { Card, Empty, LinkButton, PageHeader, Table, Td, inputCls } from "@/components/ui";
import { fmtDate } from "@/lib/util";

export default function Installations({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();
  const like = `%${q}%`;
  const rows = all(
    `SELECT i.*, c.name customer_name,
       (SELECT COUNT(*) FROM jobs j WHERE j.installation_id=i.id) jobs,
       (SELECT MAX(substr(scheduled_at,1,10)) FROM jobs j WHERE j.installation_id=i.id AND j.status='done') last_visit,
       (SELECT MIN(substr(scheduled_at,1,10)) FROM jobs j WHERE j.installation_id=i.id AND j.status IN ('scheduled','pending') AND scheduled_at IS NOT NULL) next_visit
     FROM installations i JOIN customers c ON c.id=i.customer_id
     WHERE (?='' OR i.name LIKE ? OR i.address LIKE ? OR i.city LIKE ? OR c.name LIKE ? OR i.type LIKE ?
        OR i.id IN (SELECT installation_id FROM equipment WHERE serial LIKE ? OR model LIKE ? OR brand LIKE ?))
     ORDER BY c.name COLLATE NOCASE, i.name`,
    q, like, like, like, like, like, like, like, like,
  );
  return (
    <>
      <PageHeader title="Εγκαταστάσεις" subtitle={`${rows.length} εγκαταστάσεις`} actions={<LinkButton href="/installations/new" variant="primary">+ Νέα εγκατάσταση</LinkButton>} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Διεύθυνση, πελάτης, μάρκα, σειριακός αριθμός…" className={`${inputCls} max-w-md`} />
        <button className="rounded-lg bg-gray-800 px-4 text-sm text-white">Αναζήτηση</button>
      </form>
      <Card>
        {rows.length ? (
          <Table head={["Εγκατάσταση", "Πελάτης", "Περιοχή", "Εργασίες", "Τελευταία", "Επόμενη"]}>
            {rows.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/installations/${i.id}`} className="font-medium text-brand-700 hover:underline">{i.name}</Link>
                  <div className="text-xs text-gray-500">{i.type}</div>
                </Td>
                <Td><Link href={`/customers/${i.customer_id}`} className="hover:underline">{i.customer_name}</Link></Td>
                <Td>{[i.address, i.city].filter(Boolean).join(", ") || "—"}</Td>
                <Td>{i.jobs}</Td>
                <Td>{fmtDate(i.last_visit)}</Td>
                <Td>{fmtDate(i.next_visit)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Καμία εγκατάσταση.</Empty>
        )}
      </Card>
    </>
  );
}
