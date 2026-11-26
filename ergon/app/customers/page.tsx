import Link from "next/link";
import { all } from "@/lib/db";
import { JOB_TOTAL_SQL } from "@/lib/data";
import { money, telHref } from "@/lib/util";
import { Badge, Card, Empty, LinkButton, PageHeader, Table, Td, inputCls } from "@/components/ui";

export default function Customers({ searchParams }: { searchParams: { q?: string; tag?: string; sort?: string } }) {
  const q = (searchParams.q || "").trim();
  const like = `%${q}%`;
  const rows = all(
    `SELECT c.*,
      (SELECT COUNT(*) FROM installations i WHERE i.customer_id=c.id) inst_count,
      (SELECT COUNT(*) FROM jobs j WHERE j.customer_id=c.id) job_count,
      (SELECT MAX(scheduled_at) FROM jobs j WHERE j.customer_id=c.id AND j.status='done') last_job,
      COALESCE((SELECT SUM(${JOB_TOTAL_SQL}) FROM jobs j WHERE j.customer_id=c.id AND j.status='done'),0)
        - COALESCE((SELECT SUM(amount) FROM payments p WHERE p.customer_id=c.id),0) balance
     FROM customers c
     WHERE (? = '' OR c.name LIKE ? OR c.company LIKE ? OR c.phone LIKE ? OR c.phone2 LIKE ? OR c.email LIKE ? OR c.city LIKE ? OR c.afm LIKE ? OR c.address LIKE ?)
       AND (? = '' OR (',' || REPLACE(COALESCE(c.tags,''),', ',',') || ',') LIKE ?)
     ORDER BY ${searchParams.sort === "balance" ? "balance DESC" : searchParams.sort === "recent" ? "c.created_at DESC" : "c.name COLLATE NOCASE"}`,
    q, like, like, like, like, like, like, like, like,
    searchParams.tag || "", `%,${searchParams.tag || ""},%`,
  );
  const tags = Array.from(new Set(all("SELECT tags FROM customers WHERE tags IS NOT NULL").flatMap((r) => String(r.tags).split(",").map((t) => t.trim()).filter(Boolean)))).sort();
  return (
    <>
      <PageHeader
        title="Πελάτες"
        subtitle={`${rows.length} πελάτες`}
        actions={
          <>
            <LinkButton href="/api/export/customers">⬇ CSV</LinkButton>
            <LinkButton href="/customers/new" variant="primary">+ Νέος πελάτης</LinkButton>
          </>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Όνομα, τηλέφωνο, ΑΦΜ, περιοχή…" className={`${inputCls} max-w-md flex-1`} />
        <select name="sort" defaultValue={searchParams.sort || ""} className={`${inputCls} w-auto`}>
          <option value="">Αλφαβητικά</option>
          <option value="recent">Πιο πρόσφατοι</option>
          <option value="balance">Μεγαλύτερο υπόλοιπο</option>
        </select>
        {searchParams.tag && <input type="hidden" name="tag" value={searchParams.tag} />}
        <button className="rounded-lg bg-gray-800 px-4 text-sm text-white">Αναζήτηση</button>
      </form>
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Link href="/customers"><Badge cls={!searchParams.tag ? "bg-brand-600 text-white" : undefined}>Όλοι</Badge></Link>
          {tags.map((t) => (
            <Link key={t} href={`/customers?tag=${encodeURIComponent(t)}`}>
              <Badge cls={searchParams.tag === t ? "bg-brand-600 text-white" : undefined}>{t}</Badge>
            </Link>
          ))}
        </div>
      )}
      <Card pad>
        {rows.length ? (
          <Table head={["Πελάτης", "Τηλέφωνο", "Περιοχή", "Εγκ.", "Εργασίες", "Υπόλοιπο"]}>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link>
                  {c.company && <div className="text-xs text-gray-500">{c.company}</div>}
                </Td>
                <Td>{c.phone ? <a href={telHref(c.phone)} className="whitespace-nowrap hover:underline">{c.phone}</a> : "—"}</Td>
                <Td>{c.city || "—"}</Td>
                <Td>{c.inst_count}</Td>
                <Td>{c.job_count}</Td>
                <Td className={c.balance > 0.005 ? "font-medium text-amber-700" : "text-gray-500"}>{money(c.balance)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Δεν βρέθηκαν πελάτες. <Link href="/customers/new" className="text-brand-600 underline">Πρόσθεσε τον πρώτο</Link>.</Empty>
        )}
      </Card>
    </>
  );
}
