import Link from "next/link";
import { all, get } from "@/lib/db";
import { balances, jobList, syncContracts } from "@/lib/data";
import { addDays, fmtDate, fmtDateLong, fmtTime, money, today } from "@/lib/util";
import { Card, Empty, LinkButton, PageHeader, Stat, btn } from "@/components/ui";
import { JobList } from "@/components/JobList";
import { toggleReminder } from "./actions";

export default function Dashboard() {
  const created = syncContracts();
  const t = today();
  const in7 = addDays(t, 7);
  const in30 = addDays(t, 30);
  const todays = jobList("substr(j.scheduled_at,1,10)=? AND j.status!='cancelled'", [t], "j.scheduled_at");
  const overdue = jobList("substr(j.scheduled_at,1,10)<? AND j.status IN ('scheduled','in_progress','pending')", [t], "j.scheduled_at", 30);
  const week = jobList("substr(j.scheduled_at,1,10)>? AND substr(j.scheduled_at,1,10)<=? AND j.status!='cancelled'", [t, in7], "j.scheduled_at", 40);
  const unscheduled = jobList("j.scheduled_at IS NULL AND j.status='pending'", [], "j.priority='urgent' DESC, j.priority='high' DESC, j.created_at", 20);
  const reminders = all("SELECT r.*, c.name customer_name FROM reminders r LEFT JOIN customers c ON c.id=r.customer_id WHERE r.done=0 AND r.due_date<=? ORDER BY r.due_date", in7);
  const warranties = all(
    `SELECT e.*, i.name inst_name, i.id inst_id, c.name customer_name FROM equipment e JOIN installations i ON i.id=e.installation_id JOIN customers c ON c.id=i.customer_id
     WHERE e.warranty_until BETWEEN ? AND ? ORDER BY e.warranty_until`,
    t,
    in30,
  );
  const quotesOpen = get("SELECT COUNT(*) n FROM quotes WHERE status='sent'")!.n;
  const bal = balances();
  const owed = bal.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);
  const month = t.slice(0, 7);
  const monthDone = get("SELECT COUNT(*) n FROM jobs WHERE status='done' AND substr(completed_at,1,7)=?", month)!.n;
  const monthIncome = get("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE substr(date,1,7)=?", month)!.s;
  const lowStock = all("SELECT * FROM materials WHERE stock <= 0 ORDER BY name LIMIT 8");

  return (
    <>
      <PageHeader
        title="Καλημέρα 👋"
        subtitle={fmtDateLong(t)}
        actions={
          <>
            <LinkButton href="/customers/new">+ Πελάτης</LinkButton>
            <LinkButton href="/quotes/new">+ Προσφορά</LinkButton>
            <LinkButton href="/jobs/new" variant="primary">
              + Εργασία
            </LinkButton>
          </>
        }
      />
      {created > 0 && (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">
          🔁 Δημιουργήθηκαν αυτόματα {created} εργασίες συντήρησης από τα συμβόλαια.
        </div>
      )}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Σήμερα" value={todays.length} sub="ραντεβού / εργασίες" href="/calendar?view=day" />
        <Stat label="Εκπρόθεσμες" value={overdue.length} tone={overdue.length ? "text-red-600" : undefined} href="/jobs?status=overdue" />
        <Stat label="Ανοιχτά υπόλοιπα" value={money(owed)} tone="text-amber-600" href="/finance" />
        <Stat label={`Εισπράξεις μήνα`} value={money(monthIncome)} sub={`${monthDone} ολοκληρωμένες εργασίες`} href="/reports" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title={`Σήμερα (${todays.length})`} actions={<LinkButton href="/map?day=today">🗺 Διαδρομή</LinkButton>}>
            <JobList jobs={todays} empty="Δεν υπάρχουν ραντεβού σήμερα." />
          </Card>
          {overdue.length > 0 && (
            <Card title={<span className="text-red-600">Εκπρόθεσμες ({overdue.length})</span>}>
              <JobList jobs={overdue} />
            </Card>
          )}
          <Card title="Επόμενες 7 ημέρες" actions={<LinkButton href="/calendar?view=week">Ημερολόγιο</LinkButton>}>
            <JobList jobs={week} empty="Τίποτα προγραμματισμένο." />
          </Card>
          <Card title={`Χωρίς ημερομηνία (${unscheduled.length})`}>
            <JobList jobs={unscheduled} empty="Όλες οι εργασίες έχουν προγραμματιστεί." />
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Υπενθυμίσεις" actions={<LinkButton href="/reminders">Όλες</LinkButton>}>
            {reminders.length ? (
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-start gap-2 text-sm">
                    <form action={toggleReminder}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="_back" value="/" />
                      <button className="mt-0.5 h-4 w-4 rounded border border-gray-400 hover:bg-green-100" title="Ολοκλήρωση" />
                    </form>
                    <div className="min-w-0">
                      <div className={r.due_date < t ? "font-medium text-red-600" : ""}>{r.title}</div>
                      <div className="text-xs text-gray-500">
                        {fmtDate(r.due_date)}
                        {r.customer_name && (
                          <>
                            {" · "}
                            <Link href={`/customers/${r.customer_id}`} className="hover:underline">
                              {r.customer_name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Καμία υπενθύμιση για την εβδομάδα.</Empty>
            )}
          </Card>
          {warranties.length > 0 && (
            <Card title="Λήξεις εγγύησης (30 ημ.)">
              <ul className="space-y-1.5 text-sm">
                {warranties.map((w) => (
                  <li key={w.id}>
                    <Link href={`/installations/${w.inst_id}`} className="hover:underline">
                      {w.kind} {w.brand} {w.model}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {w.customer_name} · λήγει {fmtDate(w.warranty_until)}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Οφειλές πελατών" actions={<LinkButton href="/finance">Όλες</LinkButton>}>
            {bal.filter((b) => b.balance > 0).length ? (
              <ul className="space-y-1.5 text-sm">
                {bal
                  .filter((b) => b.balance > 0)
                  .slice(0, 8)
                  .map((b) => (
                    <li key={b.id} className="flex justify-between gap-2">
                      <Link href={`/customers/${b.id}`} className="truncate hover:underline">
                        {b.name}
                      </Link>
                      <span className="font-medium text-amber-700">{money(b.balance)}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <Empty>Δεν υπάρχουν οφειλές 🎉</Empty>
            )}
          </Card>
          {quotesOpen > 0 && (
            <Link href="/quotes?status=sent" className={`${btn.secondary} w-full`}>
              📝 {quotesOpen} προσφορές περιμένουν απάντηση
            </Link>
          )}
          {lowStock.length > 0 && (
            <Card title="Υλικά χωρίς απόθεμα">
              <ul className="text-sm">
                {lowStock.map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className="text-red-600">
                      {m.stock} {m.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {todays.length > 0 && (
            <Card title="Πρόγραμμα ημέρας">
              <ol className="space-y-1 text-sm">
                {todays.map((j) => (
                  <li key={j.id} className="flex gap-2">
                    <span className="w-12 shrink-0 font-mono text-gray-500">{fmtTime(j.scheduled_at)}</span>
                    <span className="truncate">{j.customer_name}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
