import { Input, Select, Textarea, inputCls } from "./ui";
import { CustomerPicker, SubmitButton } from "./client";
import { LocationPicker } from "./MapView";
import { JOB_STATUS, PRIORITY, PROJECT_STATUS, QUOTE_STATUS } from "@/lib/util";
import type { Row } from "@/lib/db";

type Opts = { customers: Row[]; installations: Row[]; projects: Row[]; technicians: Row[]; crews: Row[] };
const toOpts = (rows: Row[]) => rows.map((r) => ({ value: r.id, label: r.name }));
const entries = (o: Record<string, { label: string }>) => Object.entries(o).map(([value, v]) => ({ value, label: v.label }));

export function CustomerForm({ c, action }: { c?: Row; action: (fd: FormData) => void }) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Input label="Ονοματεπώνυμο *" name="name" defaultValue={c?.name} required autoFocus />
      <Input label="Επωνυμία / Εταιρεία" name="company" defaultValue={c?.company ?? ""} />
      <Input label="Κινητό" name="phone" type="tel" defaultValue={c?.phone ?? ""} />
      <Input label="Δεύτερο τηλέφωνο" name="phone2" type="tel" defaultValue={c?.phone2 ?? ""} />
      <Input label="Email" name="email" type="email" defaultValue={c?.email ?? ""} />
      <Input label="ΑΦΜ" name="afm" defaultValue={c?.afm ?? ""} />
      <Input label="Διεύθυνση" name="address" defaultValue={c?.address ?? ""} />
      <Input label="Πόλη / Περιοχή" name="city" defaultValue={c?.city ?? ""} />
      <Input label="Ετικέτες" name="tags" defaultValue={c?.tags ?? ""} hint="π.χ. VIP, συμβόλαιο, κατασκευαστής — χωρισμένες με κόμμα" className="sm:col-span-2" />
      <Textarea label="Σημειώσεις" name="notes" defaultValue={c?.notes ?? ""} className="sm:col-span-2" />
      {!c && (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="create_installation" defaultChecked /> Δημιουργία εγκατάστασης στη διεύθυνση του πελάτη
        </label>
      )}
      <div className="sm:col-span-2">
        <SubmitButton>Αποθήκευση</SubmitButton>
      </div>
    </form>
  );
}

export function InstallationForm({ i, customers, customerId, action }: { i?: Row; customers: Row[]; customerId?: number; action: (fd: FormData) => void }) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {i && <input type="hidden" name="id" value={i.id} />}
      <Select label="Πελάτης *" name="customer_id" required defaultValue={i?.customer_id ?? customerId ?? ""} options={toOpts(customers)} empty="— Επιλογή —" />
      <Input label="Όνομα εγκατάστασης *" name="name" defaultValue={i?.name} required placeholder="π.χ. Κατοικία Πανοράματος, Κατάστημα" />
      <Input label="Τύπος" name="type" defaultValue={i?.type ?? ""} list="inst-types" placeholder="Κατοικία, Κατάστημα, Γραφείο…" />
      <datalist id="inst-types">
        {["Κατοικία", "Πολυκατοικία", "Κατάστημα", "Γραφείο", "Βιομηχανία", "Ξενοδοχείο", "Οικόπεδο"].map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <div />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Διεύθυνση</span>
        <input id="address" name="address" defaultValue={i?.address ?? ""} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Πόλη / Περιοχή</span>
        <input id="city" name="city" defaultValue={i?.city ?? ""} className={inputCls} />
      </label>
      <div className="sm:col-span-2">
        <LocationPicker lat={i?.lat} lng={i?.lng} />
      </div>
      <Textarea label="Τεχνικές σημειώσεις / πρόσβαση" name="notes" defaultValue={i?.notes ?? ""} className="sm:col-span-2" rows={4} />
      <div className="sm:col-span-2">
        <SubmitButton>Αποθήκευση</SubmitButton>
      </div>
    </form>
  );
}

export function JobForm({ j, o, defaults = {}, jobTypes, action }: { j?: Row; o: Opts; defaults?: Row; jobTypes: string[]; action: (fd: FormData) => void }) {
  const d = { ...defaults, ...(j || {}) };
  const date = d.scheduled_at ? String(d.scheduled_at).slice(0, 10) : d.date ?? "";
  const time = d.scheduled_at ? String(d.scheduled_at).slice(11, 16) : d.time ?? "09:00";
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {j && <input type="hidden" name="id" value={j.id} />}
      <CustomerPicker customers={o.customers as any} installations={o.installations as any} projects={o.projects as any} defaultCustomer={d.customer_id} defaultInstallation={d.installation_id} defaultProject={d.project_id} />
      <Input label="Τίτλος εργασίας *" name="title" defaultValue={d.title ?? ""} required className="sm:col-span-2" placeholder="π.χ. Συντήρηση λέβητα, Εγκατάσταση κλιματιστικού" />
      <Input label="Είδος" name="type" defaultValue={d.type ?? ""} list="job-types" />
      <datalist id="job-types">
        {jobTypes.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <Textarea label="Περιγραφή" name="description" defaultValue={d.description ?? ""} className="sm:col-span-2 lg:col-span-3" rows={3} />
      <Input label="Ημερομηνία" name="date" type="date" defaultValue={date} />
      <Input label="Ώρα" name="time" type="time" defaultValue={time} />
      <Input label="Διάρκεια (λεπτά)" name="duration_min" type="number" min={0} step={15} defaultValue={d.duration_min ?? 60} />
      <Select label="Τεχνικός" name="technician_id" defaultValue={d.technician_id ?? ""} options={toOpts(o.technicians)} empty="— Κανένας —" />
      <Select label="Συνεργείο" name="crew_id" defaultValue={d.crew_id ?? ""} options={toOpts(o.crews)} empty="— Κανένα —" />
      <Select label="Προτεραιότητα" name="priority" defaultValue={d.priority ?? "normal"} options={entries(PRIORITY)} />
      <Select label="Κατάσταση" name="status" defaultValue={d.status ?? ""} options={entries(JOB_STATUS)} empty="Αυτόματα (με βάση την ημ/νία)" />
      <Input label="Χρέωση εργασίας (€)" name="labor_price" inputMode="decimal" defaultValue={d.labor_price ?? ""} hint="Τα υλικά προστίθενται ξεχωριστά" />
      <div className="sm:col-span-2 lg:col-span-3">
        <SubmitButton>Αποθήκευση</SubmitButton>
      </div>
    </form>
  );
}

export function ProjectForm({ p, o, defaults = {}, action }: { p?: Row; o: Opts; defaults?: Row; action: (fd: FormData) => void }) {
  const d = { ...defaults, ...(p || {}) };
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <CustomerPicker customers={o.customers as any} installations={o.installations as any} defaultCustomer={d.customer_id} defaultInstallation={d.installation_id} showProject={false} />
      <Input label="Όνομα έργου *" name="name" defaultValue={d.name ?? ""} required />
      <Select label="Κατάσταση" name="status" defaultValue={d.status ?? "active"} options={entries(PROJECT_STATUS)} />
      <Input label="Έναρξη" name="start_date" type="date" defaultValue={d.start_date ?? ""} />
      <Input label="Λήξη" name="end_date" type="date" defaultValue={d.end_date ?? ""} />
      <Input label="Προϋπολογισμός (€)" name="budget" inputMode="decimal" defaultValue={d.budget ?? ""} />
      <Textarea label="Περιγραφή" name="description" defaultValue={d.description ?? ""} className="sm:col-span-2" rows={4} />
      <div className="sm:col-span-2">
        <SubmitButton>Αποθήκευση</SubmitButton>
      </div>
    </form>
  );
}

export function ContractForm({ c, o, defaults = {}, action }: { c?: Row; o: Opts; defaults?: Row; action: (fd: FormData) => void }) {
  const d = { ...defaults, ...(c || {}) };
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <CustomerPicker customers={o.customers as any} installations={o.installations as any} defaultCustomer={d.customer_id} defaultInstallation={d.installation_id} showProject={false} />
      <Input label="Τίτλος *" name="title" defaultValue={d.title ?? "Ετήσια συντήρηση"} required />
      <Input label="Κάθε πόσους μήνες" name="interval_months" type="number" min={1} defaultValue={d.interval_months ?? 12} />
      <Input label="Επόμενη επίσκεψη *" name="next_date" type="date" required defaultValue={d.next_date ?? ""} />
      <Input label="Ώρα επίσκεψης" name="visit_time" type="time" defaultValue={d.visit_time ?? "09:00"} />
      <Input label="Διάρκεια (λεπτά)" name="duration_min" type="number" defaultValue={d.duration_min ?? 60} />
      <Select label="Τεχνικός" name="technician_id" defaultValue={d.technician_id ?? ""} options={toOpts(o.technicians)} empty="— Κανένας —" />
      <Select label="Συνεργείο" name="crew_id" defaultValue={d.crew_id ?? ""} options={toOpts(o.crews)} empty="— Κανένα —" />
      <Input label="Χρέωση ανά επίσκεψη (€)" name="price" inputMode="decimal" defaultValue={d.price ?? ""} />
      <Input label="Ετήσιο συμβόλαιο (€)" name="annual_fee" inputMode="decimal" defaultValue={d.annual_fee ?? ""} hint="Πληροφοριακό" />
      <Input label="Έναρξη συμβολαίου" name="start_date" type="date" defaultValue={d.start_date ?? ""} />
      <Input label="Λήξη συμβολαίου" name="end_date" type="date" defaultValue={d.end_date ?? ""} />
      <Textarea label="Τι περιλαμβάνει η επίσκεψη" name="description" defaultValue={d.description ?? ""} className="sm:col-span-2 lg:col-span-3" />
      <Textarea label="Σημειώσεις" name="notes" defaultValue={d.notes ?? ""} className="sm:col-span-2 lg:col-span-3" rows={2} />
      {c && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={!!c.active} /> Ενεργό
        </label>
      )}
      <div className="sm:col-span-2 lg:col-span-3">
        <SubmitButton>Αποθήκευση</SubmitButton>
      </div>
    </form>
  );
}

export function QuoteMetaFields({ q, o, defaults = {} }: { q?: Row; o: Opts; defaults?: Row }) {
  const d = { ...defaults, ...(q || {}) };
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {q && <input type="hidden" name="id" value={q.id} />}
      <CustomerPicker customers={o.customers as any} installations={o.installations as any} defaultCustomer={d.customer_id} defaultInstallation={d.installation_id} showProject={false} />
      <Input label="Τίτλος *" name="title" defaultValue={d.title ?? ""} required />
      <Input label="Ημ/νία έκδοσης" name="issue_date" type="date" defaultValue={d.issue_date ?? ""} />
      <Input label="Ισχύει έως" name="valid_until" type="date" defaultValue={d.valid_until ?? ""} />
      <Select label="Κατάσταση" name="status" defaultValue={d.status ?? "draft"} options={entries(QUOTE_STATUS)} />
      <Input label="ΦΠΑ %" name="vat_rate" inputMode="decimal" defaultValue={d.vat_rate ?? 24} />
      <Input label="Έκπτωση (€)" name="discount" inputMode="decimal" defaultValue={d.discount ?? 0} />
    </div>
  );
}
