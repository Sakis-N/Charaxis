import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { customerBalance, jobList, quoteTotals } from "@/lib/data";
import { PAYMENT_METHODS, PROJECT_STATUS, QUOTE_STATUS, fmtDate, mapsHref, money, telHref, today } from "@/lib/util";
import { Badge, Card, DL, Empty, LinkButton, PageHeader, Stat, inputCls } from "@/components/ui";
import { ConfirmForm, SubmitButton } from "@/components/client";
import { JobList } from "@/components/JobList";
import { FilesCard } from "@/components/Files";
import { deletePayment, saveReminder, savePayment, toggleReminder } from "../../actions";

export default function CustomerPage({ params, searchParams }: { params: { id: string }; searchParams: { err?: string } }) {
  const id = Number(params.id);
  const c = get("SELECT * FROM customers WHERE id=?", id);
  if (!c) notFound();
  const here = `/customers/${id}`;
  const installations = all(
    `SELECT i.*, (SELECT COUNT(*) FROM jobs j WHERE j.installation_id=i.id) jobs, (SELECT COUNT(*) FROM equipment e WHERE e.installation_id=i.id) eq
     FROM installations i WHERE customer_id=? ORDER BY name`,
    id,
  );
  const jobs = jobList("j.customer_id=?", [id], "COALESCE(j.scheduled_at, j.created_at) DESC");
  const upcoming = jobs.filter((j) => ["pending", "scheduled", "in_progress"].includes(j.status));
  const history = jobs.filter((j) => !["pending", "scheduled", "in_progress"].includes(j.status));
  const quotes = all("SELECT * FROM quotes WHERE customer_id=? ORDER BY created_at DESC", id);
  const projects = all("SELECT * FROM projects WHERE customer_id=? ORDER BY created_at DESC", id);
  const contracts = all("SELECT * FROM contracts WHERE customer_id=? ORDER BY active DESC, next_date", id);
  const payments = all("SELECT p.*, j.title job_title FROM payments p LEFT JOIN jobs j ON j.id=p.job_id WHERE p.customer_id=? ORDER BY date DESC, id DESC", id);
  const reminders = all("SELECT * FROM reminders WHERE customer_id=? ORDER BY done, due_date", id);
  const files = all("SELECT * FROM files WHERE customer_id=? AND job_id IS NULL AND installation_id IS NULL ORDER BY created_at DESC", id);
  const calls = all("SELECT * FROM calls WHERE customer_id=? ORDER BY created_at DESC LIMIT 5", id);
  const bal = customerBalance(id);
  const tags = c.tags ? String(c.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : [];

  return (
    <>
      <PageHeader
        back={{ href: "/customers", label: "Πελάτες" }}
        title={c.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {c.company}
            {tags.map((t: string) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </span>
        }
        actions={
          <>
            {c.phone && <a href={telHref(c.phone)} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white">📞 Κλήση</a>}
            {c.phone && <a href={`sms:${c.phone}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">💬 SMS</a>}
            {c.phone && <a href={`https://wa.me/${String(c.phone).replace(/\D/g, "").replace(/^(69)/, "3069")}`} target="_blank" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">WhatsApp</a>}
            {c.email && <a href={`mailto:${c.email}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">✉️ Email</a>}
            <LinkButton href={`/api/contacts.vcf?customer=${id}`}>📇 Επαφή</LinkButton>
            <LinkButton href={`${here}/edit`}>✏️ Επεξεργασία</LinkButton>
            <LinkButton href={`/jobs/new?customer=${id}`} variant="primary">+ Εργασία</LinkButton>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Υπόλοιπο" value={money(bal.balance)} tone={bal.balance > 0.005 ? "text-amber-600" : "text-green-600"} />
        <Stat label="Χρεώσεις" value={money(bal.charged)} sub="ολοκληρωμένες εργασίες" />
        <Stat label="Πληρωμές" value={money(bal.paid)} />
        <Stat label="Εργασίες" value={jobs.length} sub={`${upcoming.length} ανοιχτές`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Στοιχεία">
            <DL
              items={[
                ["Κινητό", c.phone && <a href={telHref(c.phone)} className="text-brand-700">{c.phone}</a>],
                ["Τηλέφωνο 2", c.phone2 && <a href={telHref(c.phone2)} className="text-brand-700">{c.phone2}</a>],
                ["Email", c.email],
                ["ΑΦΜ", c.afm],
                ["Διεύθυνση", (c.address || c.city) && <a href={mapsHref(c)} target="_blank" className="text-brand-700">{[c.address, c.city].filter(Boolean).join(", ")}</a>],
                ["Πελάτης από", fmtDate(c.created_at)],
              ]}
            />
            {c.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-yellow-50 p-3 text-sm text-gray-800">{c.notes}</p>}
          </Card>

          <Card title={`Εγκαταστάσεις (${installations.length})`} actions={<LinkButton href={`/installations/new?customer=${id}`}>+ Εγκατάσταση</LinkButton>}>
            {installations.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {installations.map((i) => (
                  <li key={i.id}>
                    <Link href={`/installations/${i.id}`} className="block rounded-lg border border-gray-200 p-3 hover:border-brand-500 hover:bg-brand-50">
                      <div className="font-medium">🏢 {i.name}</div>
                      <div className="text-xs text-gray-500">{[i.type, i.address, i.city].filter(Boolean).join(" · ") || "—"}</div>
                      <div className="mt-1 text-xs text-gray-500">{i.jobs} εργασίες · {i.eq} εξοπλισμός {i.lat ? "· 📍" : ""}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Καμία εγκατάσταση.</Empty>
            )}
          </Card>

          <Card title={`Ανοιχτές εργασίες (${upcoming.length})`}>
            <JobList jobs={upcoming} showCustomer={false} empty="Καμία ανοιχτή εργασία." />
          </Card>
          <Card title={`Ιστορικό εργασιών (${history.length})`}>
            <JobList jobs={history} showCustomer={false} empty="Δεν υπάρχει ιστορικό ακόμα." />
          </Card>

          <Card title="Πληρωμές">
            <form action={savePayment} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
              <input type="hidden" name="customer_id" value={id} />
              <input type="hidden" name="_back" value={here} />
              <input name="amount" required placeholder="Ποσό €" inputMode="decimal" className={inputCls} />
              <input name="date" type="date" defaultValue={today()} className={inputCls} />
              <select name="method" className={inputCls}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <select name="job_id" className={inputCls}>
                <option value="">— Εργασία (προαιρ.) —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    #{j.id} {j.title}
                  </option>
                ))}
              </select>
              <input name="notes" placeholder="Σημείωση" className={inputCls} />
              <SubmitButton>+ Πληρωμή</SubmitButton>
            </form>
            {payments.length ? (
              <ul className="divide-y divide-gray-100 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                    <span>
                      {fmtDate(p.date)} · {p.method}
                      {p.job_title && <Link href={`/jobs/${p.job_id}`} className="text-gray-500 hover:underline"> · {p.job_title}</Link>}
                      {p.notes && <span className="text-gray-500"> · {p.notes}</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      <b className="text-green-700">{money(p.amount)}</b>
                      <ConfirmForm action={deletePayment} message="Διαγραφή πληρωμής;">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="_back" value={here} />
                        <button className="text-xs text-red-500">✕</button>
                      </ConfirmForm>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Καμία πληρωμή.</Empty>
            )}
          </Card>

          <FilesCard files={files} owner={{ customer_id: id }} back={here} error={searchParams.err} title="Έγγραφα πελάτη" />
        </div>

        <div className="space-y-5">
          <Card title="Υπενθυμίσεις">
            <form action={saveReminder} className="mb-3 space-y-2">
              <input type="hidden" name="customer_id" value={id} />
              <input type="hidden" name="_back" value={here} />
              <input name="title" required placeholder="π.χ. Τηλεφώνημα για προσφορά" className={inputCls} />
              <div className="flex gap-2">
                <input name="due_date" type="date" defaultValue={today()} className={inputCls} />
                <SubmitButton>+</SubmitButton>
              </div>
            </form>
            <ul className="space-y-1.5 text-sm">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <form action={toggleReminder}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="_back" value={here} />
                    <button className={`h-4 w-4 rounded border ${r.done ? "border-green-600 bg-green-500" : "border-gray-400"}`} />
                  </form>
                  <span className={r.done ? "text-gray-400 line-through" : ""}>
                    {r.title} <span className="text-xs text-gray-500">({fmtDate(r.due_date)})</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Προσφορές" actions={<LinkButton href={`/quotes/new?customer=${id}`}>+ Νέα</LinkButton>}>
            {quotes.length ? (
              <ul className="space-y-2 text-sm">
                {quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-2">
                    <Link href={`/quotes/${q.id}`} className="min-w-0 truncate hover:underline">
                      {q.number} · {q.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs">{money(quoteTotals(q.id).total)}</span>
                      <Badge cls={QUOTE_STATUS[q.status]?.cls}>{QUOTE_STATUS[q.status]?.label}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Καμία προσφορά.</Empty>
            )}
          </Card>

          <Card title="Συμβόλαια συντήρησης" actions={<LinkButton href={`/contracts?new=1&customer=${id}`}>+ Νέο</LinkButton>}>
            {contracts.length ? (
              <ul className="space-y-2 text-sm">
                {contracts.map((k) => (
                  <li key={k.id}>
                    <Link href={`/contracts?edit=${k.id}`} className="hover:underline">
                      🔁 {k.title}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {k.active ? `κάθε ${k.interval_months} μήνες · επόμενη ${fmtDate(k.next_date)}` : "ανενεργό"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Κανένα συμβόλαιο.</Empty>
            )}
          </Card>

          <Card title="Έργα" actions={<LinkButton href={`/projects/new?customer=${id}`}>+ Νέο</LinkButton>}>
            {projects.length ? (
              <ul className="space-y-2 text-sm">
                {projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <Link href={`/projects/${p.id}`} className="hover:underline">📁 {p.name}</Link>
                    <Badge cls={PROJECT_STATUS[p.status]?.cls}>{PROJECT_STATUS[p.status]?.label}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Κανένα έργο.</Empty>
            )}
          </Card>

          {calls.length > 0 && (
            <Card title="Τελευταίες κλήσεις">
              <ul className="text-sm text-gray-600">
                {calls.map((k) => (
                  <li key={k.id}>📞 {k.created_at.slice(0, 16).replace("T", " ")}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
