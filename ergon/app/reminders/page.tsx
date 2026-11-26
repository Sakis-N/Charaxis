import Link from "next/link";
import { all } from "@/lib/db";
import { fmtDate, today } from "@/lib/util";
import { Card, Empty, PageHeader, inputCls } from "@/components/ui";
import { ConfirmForm, SubmitButton } from "@/components/client";
import { deleteReminder, saveReminder, toggleReminder } from "../actions";

export default function Reminders({ searchParams }: { searchParams: { done?: string } }) {
  const t = today();
  const showDone = searchParams.done === "1";
  const rows = all(
    `SELECT r.*, c.name customer_name, j.title job_title FROM reminders r LEFT JOIN customers c ON c.id=r.customer_id LEFT JOIN jobs j ON j.id=r.job_id
     WHERE r.done=? ORDER BY r.due_date ${showDone ? "DESC" : ""}`,
    showDone ? 1 : 0,
  );
  const customers = all("SELECT id, name FROM customers ORDER BY name COLLATE NOCASE");
  return (
    <>
      <PageHeader title="Υπενθυμίσεις" subtitle="Τηλεφωνήματα, follow-up προσφορών, επόμενες επισκέψεις" />
      <Card className="mb-5">
        <form action={saveReminder} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <input type="hidden" name="_back" value="/reminders" />
          <input name="title" required placeholder="Τι πρέπει να γίνει;" className={`${inputCls} col-span-2 sm:col-span-3`} />
          <select name="customer_id" className={inputCls}>
            <option value="">— Πελάτης —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="due_date" type="date" defaultValue={t} className={inputCls} />
          <SubmitButton>+ Προσθήκη</SubmitButton>
        </form>
      </Card>
      <div className="mb-3 flex gap-3 text-sm">
        <Link href="/reminders" className={!showDone ? "font-semibold text-brand-700" : "text-gray-500"}>Ανοιχτές</Link>
        <Link href="/reminders?done=1" className={showDone ? "font-semibold text-brand-700" : "text-gray-500"}>Ολοκληρωμένες</Link>
      </div>
      <Card>
        {rows.length ? (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <form action={toggleReminder}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="_back" value={showDone ? "/reminders?done=1" : "/reminders"} />
                  <button className={`h-5 w-5 rounded border-2 ${r.done ? "border-green-600 bg-green-500" : "border-gray-400 hover:bg-green-50"}`} />
                </form>
                <div className="min-w-0 flex-1">
                  <div className={`${r.done ? "text-gray-400 line-through" : ""} ${!r.done && r.due_date < t ? "font-medium text-red-600" : ""}`}>{r.title}</div>
                  <div className="text-xs text-gray-500">
                    {fmtDate(r.due_date)}
                    {r.customer_name && <> · <Link href={`/customers/${r.customer_id}`} className="hover:underline">{r.customer_name}</Link></>}
                    {r.job_title && <> · <Link href={`/jobs/${r.job_id}`} className="hover:underline">{r.job_title}</Link></>}
                  </div>
                </div>
                <ConfirmForm action={deleteReminder} message="Διαγραφή;">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="_back" value="/reminders" />
                  <button className="text-xs text-red-500">✕</button>
                </ConfirmForm>
              </li>
            ))}
          </ul>
        ) : <Empty>Τίποτα εδώ.</Empty>}
      </Card>
    </>
  );
}
