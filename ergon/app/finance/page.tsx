import Link from "next/link";
import { all, get } from "@/lib/db";
import { balances } from "@/lib/data";
import { expenseCategories } from "@/lib/settings";
import { MONTHS_NOM, PAYMENT_METHODS, fmtDate, money, today } from "@/lib/util";
import { Card, Empty, LinkButton, PageHeader, Stat, Table, Td, inputCls } from "@/components/ui";
import { ConfirmForm, SubmitButton } from "@/components/client";
import { deleteExpense, deletePayment, saveExpense, savePayment } from "../actions";

export default function Finance({ searchParams }: { searchParams: { m?: string; tab?: string } }) {
  const t = today();
  const m = searchParams.m && /^\d{4}-\d{2}$/.test(searchParams.m) ? searchParams.m : t.slice(0, 7);
  const tab = searchParams.tab || "overview";
  const [y, mo] = m.split("-").map(Number);
  const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
  const payments = all("SELECT p.*, c.name customer_name, j.title job_title FROM payments p JOIN customers c ON c.id=p.customer_id LEFT JOIN jobs j ON j.id=p.job_id WHERE substr(p.date,1,7)=? ORDER BY p.date DESC, p.id DESC", m);
  const expenses = all("SELECT e.*, j.title job_title FROM expenses e LEFT JOIN jobs j ON j.id=e.job_id WHERE substr(e.date,1,7)=? ORDER BY e.date DESC, e.id DESC", m);
  const income = payments.reduce((s, p) => s + p.amount, 0);
  const spent = expenses.reduce((s, p) => s + p.amount, 0);
  const matCost = get("SELECT COALESCE(SUM(m.qty*m.unit_cost),0) c FROM job_materials m JOIN jobs j ON j.id=m.job_id WHERE j.status='done' AND substr(j.completed_at,1,7)=?", m)!.c;
  const bal = balances();
  const owed = bal.filter((b) => b.balance > 0);
  const customers = all("SELECT id, name FROM customers ORDER BY name COLLATE NOCASE");
  const cats = expenseCategories();
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => (catMap[e.category || "—"] = (catMap[e.category || "—"] || 0) + e.amount));
  const byCat = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const base = (p: Record<string, string>) => `/finance?${new URLSearchParams({ m, tab, ...p })}`;
  return (
    <>
      <PageHeader
        title="Οικονομικά"
        subtitle="Πληρωμές, υπόλοιπα, έξοδα"
        actions={<><LinkButton href={`/api/export/payments?m=${m}`}>⬇ Πληρωμές CSV</LinkButton><LinkButton href={`/api/export/expenses?m=${m}`}>⬇ Έξοδα CSV</LinkButton></>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={base({ m: prev })} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">‹</Link>
        <span className="min-w-[140px] text-center font-semibold">{MONTHS_NOM[mo - 1]} {y}</span>
        <Link href={base({ m: next })} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">›</Link>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-gray-300 bg-white text-sm">
          {[["overview", "Σύνοψη"], ["payments", "Πληρωμές"], ["expenses", "Έξοδα"], ["balances", "Υπόλοιπα"]].map(([k, l]) => (
            <Link key={k} href={base({ tab: k })} className={`px-3 py-1.5 ${tab === k ? "bg-brand-600 text-white" : "hover:bg-gray-50"}`}>{l}</Link>
          ))}
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Εισπράξεις" value={money(income)} tone="text-green-600" sub={`${payments.length} πληρωμές`} />
        <Stat label="Έξοδα" value={money(spent)} tone="text-red-600" sub={`+ ${money(matCost)} κόστος υλικών`} />
        <Stat label="Καθαρό ταμείο" value={money(income - spent)} tone={income - spent >= 0 ? "text-gray-900" : "text-red-600"} />
        <Stat label="Ανοιχτές οφειλές" value={money(owed.reduce((s, b) => s + b.balance, 0))} tone="text-amber-600" sub={`${owed.length} πελάτες`} />
      </div>

      {(tab === "overview" || tab === "payments") && (
        <Card title="Πληρωμές" className="mb-5">
          <form action={savePayment} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
            <input type="hidden" name="_back" value={base({})} />
            <select name="customer_id" required className={`${inputCls} col-span-2`}>
              <option value="">— Πελάτης —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="amount" required inputMode="decimal" placeholder="Ποσό €" className={inputCls} />
            <input name="date" type="date" defaultValue={t} className={inputCls} />
            <select name="method" className={inputCls}>{PAYMENT_METHODS.map((x) => <option key={x}>{x}</option>)}</select>
            <SubmitButton>+ Πληρωμή</SubmitButton>
          </form>
          {payments.length ? (
            <Table head={["Ημ/νία", "Πελάτης", "Εργασία", "Τρόπος", "Ποσό", ""]}>
              {(tab === "overview" ? payments.slice(0, 10) : payments).map((p) => (
                <tr key={p.id}>
                  <Td>{fmtDate(p.date)}</Td>
                  <Td><Link href={`/customers/${p.customer_id}`} className="hover:underline">{p.customer_name}</Link></Td>
                  <Td>{p.job_title ? <Link href={`/jobs/${p.job_id}`} className="text-xs hover:underline">{p.job_title}</Link> : <span className="text-xs text-gray-400">{p.notes || "—"}</span>}</Td>
                  <Td>{p.method}</Td>
                  <Td className="font-medium text-green-700">{money(p.amount)}</Td>
                  <Td>
                    <ConfirmForm action={deletePayment} message="Διαγραφή πληρωμής;">
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="_back" value={base({})} />
                      <button className="text-xs text-red-500">✕</button>
                    </ConfirmForm>
                  </Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>Καμία πληρωμή τον μήνα αυτό.</Empty>}
        </Card>
      )}

      {(tab === "overview" || tab === "expenses") && (
        <Card title="Έξοδα" className="mb-5">
          <form action={saveExpense} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
            <input type="hidden" name="_back" value={base({})} />
            <input name="description" required placeholder="Περιγραφή" className={`${inputCls} col-span-2`} />
            <select name="category" className={inputCls}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
            <input name="amount" required inputMode="decimal" placeholder="Ποσό €" className={inputCls} />
            <input name="date" type="date" defaultValue={t} className={inputCls} />
            <SubmitButton>+ Έξοδο</SubmitButton>
          </form>
          {byCat.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {byCat.map(([c, v]) => <span key={c} className="rounded-full bg-gray-100 px-2 py-1">{c}: <b>{money(v)}</b></span>)}
            </div>
          )}
          {expenses.length ? (
            <Table head={["Ημ/νία", "Περιγραφή", "Κατηγορία", "Ποσό", ""]}>
              {(tab === "overview" ? expenses.slice(0, 10) : expenses).map((e) => (
                <tr key={e.id}>
                  <Td>{fmtDate(e.date)}</Td>
                  <Td>{e.description}{e.job_title && <Link href={`/jobs/${e.job_id}`} className="block text-xs text-gray-500 hover:underline">{e.job_title}</Link>}</Td>
                  <Td>{e.category}</Td>
                  <Td className="font-medium text-red-600">{money(e.amount)}</Td>
                  <Td>
                    <ConfirmForm action={deleteExpense} message="Διαγραφή εξόδου;">
                      <input type="hidden" name="id" value={e.id} /><input type="hidden" name="_back" value={base({})} />
                      <button className="text-xs text-red-500">✕</button>
                    </ConfirmForm>
                  </Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>Κανένα έξοδο τον μήνα αυτό.</Empty>}
        </Card>
      )}

      {(tab === "overview" || tab === "balances") && (
        <Card title="Υπόλοιπα πελατών (σύνολο, όχι μόνο μήνα)">
          {bal.length ? (
            <Table head={["Πελάτης", "Τηλέφωνο", "Χρεώσεις", "Πληρωμές", "Υπόλοιπο"]}>
              {bal.map((b) => (
                <tr key={b.id}>
                  <Td><Link href={`/customers/${b.id}`} className="font-medium text-brand-700 hover:underline">{b.name}</Link></Td>
                  <Td>{b.phone || "—"}</Td>
                  <Td>{money(b.charged)}</Td>
                  <Td>{money(b.paid)}</Td>
                  <Td className={b.balance > 0 ? "font-bold text-amber-700" : "font-bold text-blue-700"}>{money(b.balance)}{b.balance < 0 && <span className="ml-1 text-xs font-normal">(προκαταβολή)</span>}</Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>Όλοι οι λογαριασμοί είναι εξοφλημένοι.</Empty>}
          <p className="mt-3 text-xs text-gray-500">Χρέωση = σύνολο (εργασία + υλικά) των ολοκληρωμένων εργασιών.</p>
        </Card>
      )}
    </>
  );
}
