import Link from "next/link";
import { all } from "@/lib/db";
import { jobList, syncContracts } from "@/lib/data";
import { JOB_STATUS, MONTHS_NOM, WEEKDAYS, addDays, fmtDateLong, fmtTime, today } from "@/lib/util";
import { Badge, Card, Dot, LinkButton, PageHeader, inputCls } from "@/components/ui";
import { DragJob, DropDay } from "@/components/CalendarDnD";
import type { Row } from "@/lib/db";

function mondayOf(d: string) {
  const dt = new Date(d + "T12:00:00Z");
  const wd = (dt.getUTCDay() + 6) % 7;
  return addDays(d, -wd);
}

export default function CalendarPage({ searchParams }: { searchParams: { view?: string; d?: string; tech?: string; crew?: string } }) {
  syncContracts();
  const view = searchParams.view || "month";
  const t = today();
  const d = searchParams.d && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d) ? searchParams.d : t;
  const techs = all("SELECT id, name, color FROM technicians WHERE active=1 ORDER BY name");
  const crews = all("SELECT id, name, color FROM crews ORDER BY name");

  let start: string, end: string, prev: string, next: string, title: string;
  if (view === "day") {
    start = end = d;
    prev = addDays(d, -1);
    next = addDays(d, 1);
    title = fmtDateLong(d);
  } else if (view === "week") {
    start = mondayOf(d);
    end = addDays(start, 6);
    prev = addDays(start, -7);
    next = addDays(start, 7);
    title = `${start.split("-").reverse().join("/")} – ${end.split("-").reverse().join("/")}`;
  } else {
    const first = d.slice(0, 8) + "01";
    start = mondayOf(first);
    const [y, m] = first.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const last = `${first.slice(0, 8)}${String(lastDay).padStart(2, "0")}`;
    end = addDays(mondayOf(last), 6);
    prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    title = `${MONTHS_NOM[m - 1]} ${y}`;
  }

  const where = ["substr(j.scheduled_at,1,10) BETWEEN ? AND ?", "j.status!='cancelled'"];
  const params: any[] = [start, end];
  if (searchParams.tech) { where.push("j.technician_id=?"); params.push(Number(searchParams.tech)); }
  if (searchParams.crew) { where.push("j.crew_id=?"); params.push(Number(searchParams.crew)); }
  const jobs = jobList(where.join(" AND "), params, "j.scheduled_at", 2000);
  const reminders = all("SELECT * FROM reminders WHERE done=0 AND due_date BETWEEN ? AND ?", start, end);
  const byDay = new Map<string, Row[]>();
  jobs.forEach((j) => {
    const k = String(j.scheduled_at).slice(0, 10);
    byDay.set(k, [...(byDay.get(k) || []), j]);
  });
  const remByDay = new Map<string, Row[]>();
  reminders.forEach((r) => remByDay.set(r.due_date, [...(remByDay.get(r.due_date) || []), r]));

  const days: string[] = [];
  for (let x = start; x <= end; x = addDays(x, 1)) days.push(x);
  const curMonth = d.slice(0, 7);
  const link = (p: Record<string, string>) => {
    const q = new URLSearchParams({ view, d, ...(searchParams.tech ? { tech: searchParams.tech } : {}), ...(searchParams.crew ? { crew: searchParams.crew } : {}), ...p });
    return `/calendar?${q}`;
  };
  const color = (j: Row) => j.technician_color || j.crew_color || "#6b7280";
  const unscheduled = jobList("j.scheduled_at IS NULL AND j.status='pending'", [], "j.created_at", 30);

  return (
    <>
      <PageHeader
        title="Ημερολόγιο"
        subtitle="Σύρε μια εργασία σε άλλη ημέρα για αλλαγή ημερομηνίας"
        actions={
          <>
            <LinkButton href={`/map?from=${start}&to=${end}`}>🗺 Στον χάρτη</LinkButton>
            <LinkButton href={`/jobs/new?date=${view === "day" ? d : t}`} variant="primary">+ Ραντεβού</LinkButton>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white text-sm">
          {[["month", "Μήνας"], ["week", "Εβδομάδα"], ["day", "Ημέρα"]].map(([v, l]) => (
            <Link key={v} href={link({ view: v })} className={`px-3 py-1.5 ${view === v ? "bg-brand-600 text-white" : "hover:bg-gray-50"}`}>{l}</Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Link href={link({ d: prev })} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">‹</Link>
          <Link href={link({ d: t })} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">Σήμερα</Link>
          <Link href={link({ d: next })} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">›</Link>
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="d" value={d} />
          <select name="tech" defaultValue={searchParams.tech || ""} className={`${inputCls} w-auto py-1.5`}>
            <option value="">Όλοι οι τεχνικοί</option>
            {techs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          {crews.length > 0 && (
            <select name="crew" defaultValue={searchParams.crew || ""} className={`${inputCls} w-auto py-1.5`}>
              <option value="">Όλα τα συνεργεία</option>
              {crews.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          )}
          <button className="rounded-lg bg-gray-800 px-3 text-sm text-white">OK</button>
        </form>
      </div>

      {view === "month" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-7 border-b bg-gray-50 text-center text-xs font-medium text-gray-500">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const list = byDay.get(day) || [];
              const rem = remByDay.get(day) || [];
              return (
                <DropDay key={day} date={day} className={`min-h-[92px] border-b border-r border-gray-100 p-1 sm:min-h-[110px] ${day.slice(0, 7) !== curMonth ? "bg-gray-50/60 text-gray-400" : ""}`}>
                  <div className="flex items-center justify-between">
                    <Link href={`/calendar?view=day&d=${day}`} className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${day === t ? "bg-brand-600 font-bold text-white" : "hover:bg-gray-100"}`}>{Number(day.slice(8))}</Link>
                    <Link href={`/jobs/new?date=${day}`} className="hidden text-xs text-gray-400 hover:text-brand-600 sm:block">+</Link>
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {list.slice(0, 4).map((j) => (
                      <DragJob key={j.id} id={j.id} className={`truncate rounded px-1 py-0.5 text-[11px] leading-tight text-white ${j.status === "done" ? "opacity-60 line-through" : ""}`} style={{ background: color(j) }}>
                        <span className="hidden sm:inline">{fmtTime(j.scheduled_at)} </span>{j.customer_name}
                      </DragJob>
                    ))}
                    {list.length > 4 && <Link href={`/calendar?view=day&d=${day}`} className="block text-[11px] text-gray-500">+{list.length - 4} ακόμα</Link>}
                    {rem.map((r) => <div key={r.id} className="truncate text-[11px] text-amber-700">⏰ {r.title}</div>)}
                  </div>
                </DropDay>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="grid gap-2 md:grid-cols-7">
          {days.map((day, i) => {
            const list = byDay.get(day) || [];
            return (
              <DropDay key={day} date={day} className={`min-h-[140px] rounded-xl border bg-white p-2 ${day === t ? "border-brand-500" : "border-gray-200"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <Link href={`/calendar?view=day&d=${day}`} className="text-sm font-semibold">{WEEKDAYS[i]} {Number(day.slice(8))}/{Number(day.slice(5, 7))}</Link>
                  <Link href={`/jobs/new?date=${day}`} className="text-gray-400 hover:text-brand-600">+</Link>
                </div>
                <div className="space-y-1.5">
                  {list.map((j) => (
                    <DragJob key={j.id} id={j.id} className="rounded-lg border-l-4 bg-gray-50 p-1.5 text-xs hover:bg-gray-100" style={{ borderColor: color(j) }}>
                      <div className="font-semibold">{fmtTime(j.scheduled_at)} · {j.customer_name}</div>
                      <div className="truncate text-gray-600">{j.title}</div>
                      {j.city && <div className="truncate text-gray-400">{j.city}</div>}
                    </DragJob>
                  ))}
                  {(remByDay.get(day) || []).map((r) => <div key={r.id} className="text-xs text-amber-700">⏰ {r.title}</div>)}
                </div>
              </DropDay>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card title={`${jobs.length} εργασίες`} className="lg:col-span-2" actions={<LinkButton href={`/map?day=${d}`}>🗺 Διαδρομή ημέρας</LinkButton>}>
            {jobs.length ? (
              <ol className="relative space-y-3 border-l-2 border-gray-200 pl-5">
                {jobs.map((j) => (
                  <li key={j.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: color(j) }} />
                    <Link href={`/jobs/${j.id}`} className="block rounded-lg border border-gray-200 p-3 hover:border-brand-500">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold">{fmtTime(j.scheduled_at)}</span>
                        <span className="text-xs text-gray-500">({j.duration_min}′)</span>
                        <span className="font-medium">{j.customer_name}</span>
                        <Badge cls={JOB_STATUS[j.status]?.cls}>{JOB_STATUS[j.status]?.label}</Badge>
                      </div>
                      <div className="text-sm">{j.title}</div>
                      <div className="text-xs text-gray-500">
                        {[j.address, j.city].filter(Boolean).join(", ")}
                        {j.customer_phone && ` · 📞 ${j.customer_phone}`}
                      </div>
                      {(j.technician_name || j.crew_name) && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600"><Dot color={color(j)} />{[j.technician_name, j.crew_name].filter(Boolean).join(" · ")}</div>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">Κανένα ραντεβού. <Link href={`/jobs/new?date=${d}`} className="text-brand-600 underline">Πρόσθεσε</Link></p>
            )}
          </Card>
          <Card title="Χωρίς ημερομηνία — σύρε στην ημέρα">
            <DropDay date={d} className="mb-3 rounded-lg border-2 border-dashed border-gray-300 p-3 text-center text-xs text-gray-500">
              Άφησε εδώ για {d.split("-").reverse().join("/")}
            </DropDay>
            <div className="space-y-1.5">
              {unscheduled.map((j) => (
                <DragJob key={j.id} id={j.id} className="rounded-lg bg-gray-50 p-2 text-xs hover:bg-gray-100">
                  <b>{j.customer_name}</b> · {j.title}
                </DragJob>
              ))}
            </div>
          </Card>
        </div>
      )}

      {techs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
          {techs.map((x) => <span key={x.id} className="flex items-center gap-1.5"><Dot color={x.color} />{x.name}</span>)}
          {crews.map((x) => <span key={`c${x.id}`} className="flex items-center gap-1.5"><Dot color={x.color} />{x.name} (συνεργείο)</span>)}
        </div>
      )}
    </>
  );
}
