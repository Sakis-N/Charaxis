import Link from "next/link";
import { all, get } from "@/lib/db";
import { JOB_TOTAL_SQL } from "@/lib/data";
import { MONTHS_NOM, money, today } from "@/lib/util";
import { Card, Empty, PageHeader, Stat, Table, Td, inputCls } from "@/components/ui";
import { PrintButton } from "@/components/client";

export default function Reports({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const t = today();
  const from = searchParams.from || `${t.slice(0, 4)}-01-01`;
  const to = searchParams.to || t;
  const doneWhere = "j.status='done' AND substr(COALESCE(j.completed_at, j.scheduled_at),1,10) BETWEEN ? AND ?";
  const jobsDone = get(`SELECT COUNT(*) n, COALESCE(SUM(${JOB_TOTAL_SQL}),0) v FROM jobs j WHERE ${doneWhere}`, from, to)!;
  const income = get("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE date BETWEEN ? AND ?", from, to)!.s;
  const expenses = get("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE date BETWEEN ? AND ?", from, to)!.s;
  const matCost = get(`SELECT COALESCE(SUM(m.qty*m.unit_cost),0) c FROM job_materials m JOIN jobs j ON j.id=m.job_id WHERE ${doneWhere}`, from, to)!.c;
  const monthly = all(
    `SELECT substr(COALESCE(j.completed_at, j.scheduled_at),1,7) m, COUNT(*) n, SUM(${JOB_TOTAL_SQL}) v FROM jobs j WHERE ${doneWhere} GROUP BY m ORDER BY m`,
    from, to,
  );
  const payMonthly = Object.fromEntries(all("SELECT substr(date,1,7) m, SUM(amount) s FROM payments WHERE date BETWEEN ? AND ? GROUP BY m", from, to).map((r) => [r.m, r.s]));
  const expMonthly = Object.fromEntries(all("SELECT substr(date,1,7) m, SUM(amount) s FROM expenses WHERE date BETWEEN ? AND ? GROUP BY m", from, to).map((r) => [r.m, r.s]));
  const months = Array.from(new Set([...monthly.map((r) => r.m), ...Object.keys(payMonthly), ...Object.keys(expMonthly)])).sort();
  const maxV = Math.max(1, ...months.map((m) => Math.max(payMonthly[m] || 0, monthly.find((r) => r.m === m)?.v || 0)));
  const byType = all(`SELECT COALESCE(j.type,'—') type, COUNT(*) n, SUM(${JOB_TOTAL_SQL}) v FROM jobs j WHERE ${doneWhere} GROUP BY type ORDER BY v DESC`, from, to);
  const byTech = all(
    `SELECT COALESCE(t.name,'(χωρίς ανάθεση)') name, t.color, COUNT(*) n, SUM(${JOB_TOTAL_SQL}) v, SUM(j.duration_min) mins
     FROM jobs j LEFT JOIN technicians t ON t.id=j.technician_id WHERE ${doneWhere} GROUP BY j.technician_id ORDER BY n DESC`,
    from, to,
  );
  const topCustomers = all(
    `SELECT c.id, c.name, COUNT(*) n, SUM(${JOB_TOTAL_SQL}) v FROM jobs j JOIN customers c ON c.id=j.customer_id WHERE ${doneWhere} GROUP BY c.id ORDER BY v DESC LIMIT 10`,
    from, to,
  );
  const topMaterials = all(
    `SELECT m.name, SUM(m.qty) q, m.unit, SUM(m.qty*m.unit_price) v, SUM(m.qty*m.unit_cost) c FROM job_materials m JOIN jobs j ON j.id=m.job_id WHERE ${doneWhere} GROUP BY m.name ORDER BY v DESC LIMIT 10`,
    from, to,
  );
  const quoteStats = all("SELECT status, COUNT(*) n FROM quotes WHERE issue_date BETWEEN ? AND ? GROUP BY status", from, to);
  const qTotal = quoteStats.reduce((s, r) => s + r.n, 0);
  const qAcc = quoteStats.find((r) => r.status === "accepted")?.n || 0;
  const y = Number(t.slice(0, 4));
  return (
    <>
      <PageHeader title="Αναφορές" subtitle="Απόδοση, έσοδα, έξοδα, τεχνικοί" actions={<PrintButton />} />
      <form className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <input type="date" name="from" defaultValue={from} className={`${inputCls} w-auto`} />
        <span>–</span>
        <input type="date" name="to" defaultValue={to} className={`${inputCls} w-auto`} />
        <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white">Εμφάνιση</button>
        {[[`${y}-01-01`, t, "Φέτος"], [`${y - 1}-01-01`, `${y - 1}-12-31`, "Πέρσι"], [`${t.slice(0, 7)}-01`, t, "Αυτός ο μήνας"]].map(([f, tt, l]) => (
          <Link key={l} href={`/reports?from=${f}&to=${tt}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{l}</Link>
        ))}
      </form>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Ολοκληρωμένες" value={jobsDone.n} />
        <Stat label="Τζίρος εργασιών" value={money(jobsDone.v)} />
        <Stat label="Εισπράξεις" value={money(income)} tone="text-green-600" />
        <Stat label="Έξοδα + υλικά" value={money(expenses + matCost)} tone="text-red-600" />
        <Stat label="Μικτό κέρδος" value={money(jobsDone.v - expenses - matCost)} sub={qTotal ? `προσφορές: ${qAcc}/${qTotal} εγκρίθηκαν` : undefined} />
      </div>
      <Card title="Ανά μήνα" className="mb-5">
        {months.length ? (
          <div className="space-y-2">
            {months.map((m) => {
              const r = monthly.find((x) => x.m === m);
              const [yy, mm] = m.split("-").map(Number);
              return (
                <div key={m} className="grid grid-cols-[110px_1fr] items-center gap-3 text-xs">
                  <div className="text-gray-600">{MONTHS_NOM[mm - 1].slice(0, 3)} {yy}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2"><div className="h-2.5 rounded bg-brand-500" style={{ width: `${((r?.v || 0) / maxV) * 100}%` }} /><span>{money(r?.v)} · {r?.n || 0} εργ.</span></div>
                    <div className="flex items-center gap-2"><div className="h-2.5 rounded bg-green-500" style={{ width: `${((payMonthly[m] || 0) / maxV) * 100}%` }} /><span>{money(payMonthly[m])} εισπρ.</span></div>
                    {expMonthly[m] ? <div className="flex items-center gap-2"><div className="h-2.5 rounded bg-red-400" style={{ width: `${(expMonthly[m] / maxV) * 100}%` }} /><span>{money(expMonthly[m])} έξοδα</span></div> : null}
                  </div>
                </div>
              );
            })}
            <div className="flex gap-4 pt-2 text-xs text-gray-500"><span>■ <span className="text-brand-500">Τζίρος</span></span><span>■ <span className="text-green-600">Εισπράξεις</span></span><span>■ <span className="text-red-500">Έξοδα</span></span></div>
          </div>
        ) : <Empty>Δεν υπάρχουν δεδομένα στην περίοδο.</Empty>}
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Ανά τεχνικό">
          {byTech.length ? (
            <Table head={["Τεχνικός", "Εργασίες", "Ώρες", "Αξία"]}>
              {byTech.map((r) => <tr key={r.name}><Td>{r.name}</Td><Td>{r.n}</Td><Td>{Math.round((r.mins || 0) / 6) / 10}</Td><Td>{money(r.v)}</Td></tr>)}
            </Table>
          ) : <Empty>—</Empty>}
        </Card>
        <Card title="Ανά είδος εργασίας">
          {byType.length ? (
            <Table head={["Είδος", "Εργασίες", "Αξία"]}>
              {byType.map((r) => <tr key={r.type}><Td>{r.type}</Td><Td>{r.n}</Td><Td>{money(r.v)}</Td></tr>)}
            </Table>
          ) : <Empty>—</Empty>}
        </Card>
        <Card title="Κορυφαίοι πελάτες">
          {topCustomers.length ? (
            <Table head={["Πελάτης", "Εργασίες", "Αξία"]}>
              {topCustomers.map((r) => <tr key={r.id}><Td><Link href={`/customers/${r.id}`} className="hover:underline">{r.name}</Link></Td><Td>{r.n}</Td><Td>{money(r.v)}</Td></tr>)}
            </Table>
          ) : <Empty>—</Empty>}
        </Card>
        <Card title="Υλικά που χρησιμοποιήθηκαν">
          {topMaterials.length ? (
            <Table head={["Υλικό", "Ποσότητα", "Πώληση", "Κέρδος"]}>
              {topMaterials.map((r) => <tr key={r.name}><Td>{r.name}</Td><Td>{r.q} {r.unit}</Td><Td>{money(r.v)}</Td><Td>{money(r.v - r.c)}</Td></tr>)}
            </Table>
          ) : <Empty>—</Empty>}
        </Card>
      </div>
    </>
  );
}
