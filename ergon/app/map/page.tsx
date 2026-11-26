import Link from "next/link";
import { all } from "@/lib/db";
import { jobList } from "@/lib/data";
import { addDays, fmtTime, today } from "@/lib/util";
import { Card, Empty, PageHeader, inputCls } from "@/components/ui";
import { MapView, type MapPoint } from "@/components/MapView";

export default function MapPage({ searchParams }: { searchParams: { day?: string; from?: string; to?: string; mode?: string; tech?: string } }) {
  const t = today();
  const mode = searchParams.mode || (searchParams.day || searchParams.from ? "jobs" : "installations");
  const techs = all("SELECT id, name FROM technicians WHERE active=1 ORDER BY name");
  let points: MapPoint[] = [];
  let missing: any[] = [];
  let label = "";
  let route = false;
  if (mode === "jobs") {
    const day = searchParams.day === "today" ? t : searchParams.day;
    const from = day || searchParams.from || t;
    const to = day || searchParams.to || addDays(t, 7);
    const where = ["substr(j.scheduled_at,1,10) BETWEEN ? AND ?", "j.status!='cancelled'"];
    const params: any[] = [from, to];
    if (searchParams.tech) { where.push("j.technician_id=?"); params.push(Number(searchParams.tech)); }
    const jobs = jobList(where.join(" AND "), params, "j.scheduled_at");
    route = from === to;
    label = from === to ? `Ραντεβού ${from.split("-").reverse().join("/")}` : `Ραντεβού ${from.split("-").reverse().join("/")} – ${to.split("-").reverse().join("/")}`;
    jobs.forEach((j, i) => {
      if (j.lat != null && j.lng != null) {
        points.push({ lat: j.lat, lng: j.lng, title: `${fmtTime(j.scheduled_at)} ${j.customer_name}`, sub: `${j.title}${j.address ? " · " + j.address : ""}`, href: `/jobs/${j.id}`, color: j.technician_color || j.crew_color || (j.status === "done" ? "#16a34a" : "#1f63c8"), label: route ? String(i + 1) : "" });
      } else missing.push(j);
    });
  } else {
    const rows = all("SELECT i.*, c.name customer_name FROM installations i JOIN customers c ON c.id=i.customer_id");
    label = `Όλες οι εγκαταστάσεις (${rows.length})`;
    rows.forEach((i) => {
      if (i.lat != null && i.lng != null) points.push({ lat: i.lat, lng: i.lng, title: i.customer_name, sub: `${i.name}${i.address ? " · " + i.address : ""}`, href: `/installations/${i.id}` });
      else missing.push(i);
    });
  }
  const gmaps = route && points.length > 0 ? `https://www.google.com/maps/dir/${points.map((p) => `${p.lat},${p.lng}`).join("/")}` : null;
  return (
    <>
      <PageHeader title="Χάρτης" subtitle={label} />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="mode" defaultValue={mode} className={`${inputCls} w-auto`}>
          <option value="jobs">Ραντεβού</option>
          <option value="installations">Όλες οι εγκαταστάσεις</option>
        </select>
        <input type="date" name="from" defaultValue={searchParams.from || searchParams.day?.replace("today", t) || t} className={`${inputCls} w-auto`} />
        <input type="date" name="to" defaultValue={searchParams.to || searchParams.day?.replace("today", t) || addDays(t, 7)} className={`${inputCls} w-auto`} />
        <select name="tech" defaultValue={searchParams.tech || ""} className={`${inputCls} w-auto`}>
          <option value="">Όλοι οι τεχνικοί</option>
          {techs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <button className="rounded-lg bg-gray-800 px-4 text-sm text-white">Εμφάνιση</button>
        <Link href={`/map?day=${t}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">Σήμερα</Link>
        <Link href={`/map?day=${addDays(t, 1)}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">Αύριο</Link>
        {gmaps && <a href={gmaps} target="_blank" className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white">🧭 Διαδρομή στο Google Maps</a>}
      </form>
      <MapView points={points} height={560} route={route} />
      {missing.length > 0 && (
        <Card title={`Χωρίς θέση στον χάρτη (${missing.length})`} className="mt-5">
          {missing.length ? (
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {missing.slice(0, 40).map((m) => (
                <li key={m.id}>
                  <Link href={mode === "jobs" ? (m.installation_id ? `/installations/${m.installation_id}/edit` : `/jobs/${m.id}`) : `/installations/${m.id}/edit`} className="text-brand-700 hover:underline">
                    {m.customer_name} · {m.installation_name || m.name || m.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty>—</Empty>}
          <p className="mt-2 text-xs text-gray-500">Όρισε θέση στην επεξεργασία εγκατάστασης («Από διεύθυνση» ή κλικ στον χάρτη).</p>
        </Card>
      )}
    </>
  );
}
