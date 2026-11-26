import Link from "next/link";
import { redirect } from "next/navigation";
import { all, normPhone } from "@/lib/db";
import { jobList } from "@/lib/data";
import { Card, Empty, PageHeader } from "@/components/ui";
import { JobList } from "@/components/JobList";

export default function Search({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();
  if (!q) redirect("/");
  const l = `%${q}%`;
  const n = normPhone(q);
  const customers = all(
    `SELECT * FROM customers WHERE name LIKE ? OR company LIKE ? OR email LIKE ? OR afm LIKE ? OR address LIKE ? OR city LIKE ? OR notes LIKE ? OR tags LIKE ?
       ${n && n.length >= 4 ? "OR phone_norm LIKE ? OR phone2_norm LIKE ?" : ""} ORDER BY name LIMIT 30`,
    l, l, l, l, l, l, l, l, ...(n && n.length >= 4 ? [`%${n}%`, `%${n}%`] : []),
  );
  const inst = all("SELECT i.*, c.name customer_name FROM installations i JOIN customers c ON c.id=i.customer_id WHERE i.name LIKE ? OR i.address LIKE ? OR i.city LIKE ? OR i.notes LIKE ? LIMIT 20", l, l, l, l);
  const equipment = all("SELECT e.*, i.name inst_name, c.name customer_name FROM equipment e JOIN installations i ON i.id=e.installation_id JOIN customers c ON c.id=i.customer_id WHERE e.serial LIKE ? OR e.model LIKE ? OR e.brand LIKE ? OR e.kind LIKE ? LIMIT 20", l, l, l, l);
  const jobs = jobList("(j.title LIKE ? OR j.description LIKE ? OR j.work_notes LIKE ? OR j.tech_notes LIKE ? OR CAST(j.id AS TEXT)=?)", [l, l, l, l, q], "COALESCE(j.scheduled_at, j.created_at) DESC", 30);
  const quotes = all("SELECT q.*, c.name customer_name FROM quotes q JOIN customers c ON c.id=q.customer_id WHERE q.title LIKE ? OR q.number LIKE ? LIMIT 20", l, l);
  if (customers.length === 1 && !inst.length && !jobs.length && !equipment.length && !quotes.length) redirect(`/customers/${customers[0].id}`);
  const none = !customers.length && !inst.length && !jobs.length && !equipment.length && !quotes.length;
  return (
    <>
      <PageHeader title={`Αναζήτηση: «${q}»`} />
      {none && <Empty>Δεν βρέθηκε τίποτα. {n && n.length >= 10 && <Link href={`/customers/new?phone=${encodeURIComponent(q)}`} className="text-brand-600 underline">Νέος πελάτης με αυτό το τηλέφωνο</Link>}</Empty>}
      <div className="space-y-5">
        {customers.length > 0 && (
          <Card title={`Πελάτες (${customers.length})`}>
            <ul className="divide-y divide-gray-100">{customers.map((c) => <li key={c.id} className="py-2"><Link href={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link> <span className="text-sm text-gray-500">{[c.company, c.phone, c.city].filter(Boolean).join(" · ")}</span></li>)}</ul>
          </Card>
        )}
        {inst.length > 0 && (
          <Card title={`Εγκαταστάσεις (${inst.length})`}>
            <ul className="divide-y divide-gray-100">{inst.map((i) => <li key={i.id} className="py-2"><Link href={`/installations/${i.id}`} className="font-medium text-brand-700 hover:underline">{i.name}</Link> <span className="text-sm text-gray-500">{i.customer_name} · {[i.address, i.city].filter(Boolean).join(", ")}</span></li>)}</ul>
          </Card>
        )}
        {equipment.length > 0 && (
          <Card title={`Εξοπλισμός (${equipment.length})`}>
            <ul className="divide-y divide-gray-100">{equipment.map((e) => <li key={e.id} className="py-2"><Link href={`/installations/${e.installation_id}`} className="font-medium text-brand-700 hover:underline">{e.kind} {e.brand} {e.model}</Link> <span className="text-sm text-gray-500">S/N {e.serial || "—"} · {e.customer_name}</span></li>)}</ul>
          </Card>
        )}
        {jobs.length > 0 && <Card title={`Εργασίες (${jobs.length})`}><JobList jobs={jobs} /></Card>}
        {quotes.length > 0 && (
          <Card title={`Προσφορές (${quotes.length})`}>
            <ul className="divide-y divide-gray-100">{quotes.map((x) => <li key={x.id} className="py-2"><Link href={`/quotes/${x.id}`} className="font-medium text-brand-700 hover:underline">{x.number} {x.title}</Link> <span className="text-sm text-gray-500">{x.customer_name}</span></li>)}</ul>
          </Card>
        )}
      </div>
    </>
  );
}
