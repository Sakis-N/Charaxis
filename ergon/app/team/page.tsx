import Link from "next/link";
import { all, get } from "@/lib/db";
import { today } from "@/lib/util";
import { Card, Dot, Empty, Input, LinkButton, PageHeader, Select, inputCls } from "@/components/ui";
import { ConfirmForm, SubmitButton } from "@/components/client";
import { deleteCrew, deleteTechnician, saveCrew, saveTechnician } from "../actions";

export default function Team({ searchParams }: { searchParams: { t?: string; c?: string } }) {
  const t = today();
  const techs = all(
    `SELECT t.*, cr.name crew_name,
      (SELECT COUNT(*) FROM jobs j WHERE j.technician_id=t.id AND j.status IN ('scheduled','pending','in_progress')) open_jobs,
      (SELECT COUNT(*) FROM jobs j WHERE j.technician_id=t.id AND substr(j.scheduled_at,1,10)=?) today_jobs
     FROM technicians t LEFT JOIN crews cr ON cr.id=t.crew_id ORDER BY t.active DESC, t.name`,
    t,
  );
  const crews = all("SELECT c.*, (SELECT COUNT(*) FROM technicians t WHERE t.crew_id=c.id) members FROM crews c ORDER BY name");
  const et = searchParams.t ? get("SELECT * FROM technicians WHERE id=?", Number(searchParams.t)) : undefined;
  const ec = searchParams.c ? get("SELECT * FROM crews WHERE id=?", Number(searchParams.c)) : undefined;
  return (
    <>
      <PageHeader title="Τεχνικοί & συνεργεία" subtitle="Ανάθεση εργασιών και χρώματα στο ημερολόγιο" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card title="Τεχνικοί">
            {techs.length ? (
              <ul className="divide-y divide-gray-100">
                {techs.map((x) => (
                  <li key={x.id} className={`flex items-center justify-between gap-2 py-2 ${x.active ? "" : "opacity-50"}`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <Dot color={x.color} />
                      <div className="min-w-0">
                        <div className="font-medium">{x.name} {x.specialty && <span className="text-xs font-normal text-gray-500">· {x.specialty}</span>}</div>
                        <div className="text-xs text-gray-500">{[x.phone, x.crew_name && `συνεργείο: ${x.crew_name}`].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <Link href={`/calendar?view=week&tech=${x.id}`} className="text-brand-600">{x.today_jobs} σήμερα · {x.open_jobs} ανοιχτές</Link>
                      <Link href={`/team?t=${x.id}`} className="text-gray-500">✏️</Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty>Πρόσθεσε τον εαυτό σου και τους συνεργάτες σου.</Empty>}
          </Card>
          <Card title={et ? `Επεξεργασία: ${et.name}` : "Νέος τεχνικός"} actions={et && <LinkButton href="/team">Άκυρο</LinkButton>}>
            <form action={saveTechnician} className="grid gap-3 sm:grid-cols-2" key={et?.id ?? "n"}>
              {et && <input type="hidden" name="id" value={et.id} />}
              <Input label="Όνομα *" name="name" required defaultValue={et?.name} />
              <Input label="Ειδικότητα" name="specialty" defaultValue={et?.specialty ?? ""} placeholder="Ηλεκτρολόγος, Υδραυλικός…" />
              <Input label="Τηλέφωνο" name="phone" defaultValue={et?.phone ?? ""} />
              <Input label="Email" name="email" defaultValue={et?.email ?? ""} />
              <Select label="Συνεργείο" name="crew_id" defaultValue={et?.crew_id ?? ""} options={crews.map((c) => ({ value: c.id, label: c.name }))} empty="— Κανένα —" />
              <label className="block"><span className="mb-1 block text-xs font-medium text-gray-600">Χρώμα</span><input type="color" name="color" defaultValue={et?.color ?? "#16a34a"} className={`${inputCls} h-10 p-1`} /></label>
              {et && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={!!et.active} /> Ενεργός</label>}
              <div className="flex items-center gap-3 sm:col-span-2">
                <SubmitButton>Αποθήκευση</SubmitButton>
                {et && (
                  <ConfirmForm action={deleteTechnician} message="Διαγραφή τεχνικού; (οι εργασίες του μένουν χωρίς ανάθεση)">
                    <input type="hidden" name="id" value={et.id} />
                    <button className="text-sm text-red-600">Διαγραφή</button>
                  </ConfirmForm>
                )}
              </div>
            </form>
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Συνεργεία">
            {crews.length ? (
              <ul className="divide-y divide-gray-100">
                {crews.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2"><Dot color={c.color} /><b>{c.name}</b><span className="text-xs text-gray-500">{c.members} μέλη</span></span>
                    <span className="flex gap-3 text-xs"><Link href={`/calendar?view=week&crew=${c.id}`} className="text-brand-600">Πρόγραμμα</Link><Link href={`/team?c=${c.id}`} className="text-gray-500">✏️</Link></span>
                  </li>
                ))}
              </ul>
            ) : <Empty>Κανένα συνεργείο. Χρήσιμο αν δουλεύεις με ομάδες ή υπεργολάβους.</Empty>}
          </Card>
          <Card title={ec ? `Επεξεργασία: ${ec.name}` : "Νέο συνεργείο"} actions={ec && <LinkButton href="/team">Άκυρο</LinkButton>}>
            <form action={saveCrew} className="grid gap-3 sm:grid-cols-2" key={ec?.id ?? "n"}>
              {ec && <input type="hidden" name="id" value={ec.id} />}
              <Input label="Όνομα *" name="name" required defaultValue={ec?.name} />
              <label className="block"><span className="mb-1 block text-xs font-medium text-gray-600">Χρώμα</span><input type="color" name="color" defaultValue={ec?.color ?? "#2f7ae5"} className={`${inputCls} h-10 p-1`} /></label>
              <Input label="Σημειώσεις" name="notes" defaultValue={ec?.notes ?? ""} className="sm:col-span-2" />
              <div className="flex items-center gap-3 sm:col-span-2">
                <SubmitButton>Αποθήκευση</SubmitButton>
                {ec && (
                  <ConfirmForm action={deleteCrew} message="Διαγραφή συνεργείου;">
                    <input type="hidden" name="id" value={ec.id} />
                    <button className="text-sm text-red-600">Διαγραφή</button>
                  </ConfirmForm>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
