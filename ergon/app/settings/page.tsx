import { headers } from "next/headers";
import { all, get, getSettings, DATA_DIR } from "@/lib/db";
import { DEFAULT_EXPENSE_CATS, DEFAULT_JOB_TYPES } from "@/lib/settings";
import { Card, Input, LinkButton, PageHeader, Textarea, btn } from "@/components/ui";
import { CopyText, SubmitButton } from "@/components/client";
import { logout, saveSettings } from "../actions";

export default function Settings({ searchParams }: { searchParams: { saved?: string } }) {
  const s = getSettings();
  const h = headers();
  const origin = process.env.PUBLIC_URL || `${h.get("x-forwarded-proto") || "http"}://${h.get("host")}`;
  const token = process.env.API_TOKEN;
  const key = token ? `key=${token}` : "key=ΤΟ_API_TOKEN_ΣΟΥ";
  const techs = all("SELECT id, name FROM technicians WHERE active=1");
  const counts = get("SELECT (SELECT COUNT(*) FROM customers) c, (SELECT COUNT(*) FROM jobs) j, (SELECT COUNT(*) FROM files) f, (SELECT COALESCE(SUM(size),0) FROM files) fs")!;
  return (
    <>
      <PageHeader title="Ρυθμίσεις" actions={<form action={logout}><button className={btn.secondary}>Αποσύνδεση</button></form>} />
      {searchParams.saved && <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">✓ Αποθηκεύτηκε</div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <form action={saveSettings} className="space-y-5">
          <Card title="Στοιχεία επιχείρησης (στις αναφορές & προσφορές)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Επωνυμία" name="business_name" defaultValue={s.business_name} />
              <Input label="Υπεύθυνος / Ιδιότητα" name="business_owner" defaultValue={s.business_owner} placeholder="π.χ. Διπλ. Μηχανολόγος Μηχανικός" />
              <Input label="ΑΦΜ" name="business_afm" defaultValue={s.business_afm} />
              <Input label="ΔΟΥ" name="business_doy" defaultValue={s.business_doy} />
              <Input label="Διεύθυνση" name="business_address" defaultValue={s.business_address} className="sm:col-span-2" />
              <Input label="Τηλέφωνο" name="business_phone" defaultValue={s.business_phone} />
              <Input label="Email" name="business_email" defaultValue={s.business_email} />
              <Input label="Ιστοσελίδα" name="business_website" defaultValue={s.business_website} />
              <Input label="Προεπιλεγμένος ΦΠΑ %" name="default_vat" defaultValue={s.default_vat || "24"} />
            </div>
          </Card>
          <Card title="Κείμενα & λίστες">
            <div className="grid gap-3">
              <Textarea label="Όροι προσφορών (προεπιλογή)" name="quote_terms" defaultValue={s.quote_terms || "Η προσφορά ισχύει για 30 ημέρες.\nΠροκαταβολή 30% με την ανάθεση, εξόφληση με την παράδοση.\nΟι τιμές δεν περιλαμβάνουν ΦΠΑ εκτός αν αναφέρεται."} rows={4} />
              <Textarea label="Υποσέλιδο αναφορών" name="report_footer" defaultValue={s.report_footer} rows={2} />
              <Input label="Είδη εργασιών (με κόμμα)" name="job_types" defaultValue={s.job_types || DEFAULT_JOB_TYPES} />
              <Input label="Κατηγορίες εξόδων (με κόμμα)" name="expense_categories" defaultValue={s.expense_categories || DEFAULT_EXPENSE_CATS} />
            </div>
          </Card>
          <SubmitButton>Αποθήκευση ρυθμίσεων</SubmitButton>
        </form>

        <div className="space-y-5">
          <Card title="📱 Κινητό: επαφές">
            <p className="mb-2 text-sm text-gray-600">Κατέβασε όλους τους πελάτες ως επαφές (.vcf) και άνοιξέ το στο κινητό. Έτσι βλέπεις το όνομα του πελάτη όταν καλεί, ακόμα και χωρίς internet.</p>
            <div className="mb-3 flex gap-2"><LinkButton href="/api/contacts.vcf" variant="primary">⬇ Όλοι οι πελάτες (.vcf)</LinkButton></div>
            <p className="mb-1 text-xs text-gray-500">Σύνδεσμος για αυτόματη ενημέρωση (π.χ. εβδομαδιαίος αυτοματισμός που κατεβάζει το αρχείο):</p>
            <CopyText text={`${origin}/api/contacts.vcf?${key}`} />
          </Card>

          <Card title="📞 Κινητό: αναγνώριση πελάτη στην εισερχόμενη κλήση">
            {!token && <p className="mb-2 rounded bg-amber-50 p-2 text-xs text-amber-800">Όρισε <code>API_TOKEN</code> στο <code>.env</code> για να λειτουργήσουν τα παρακάτω χωρίς σύνδεση.</p>}
            <ol className="mb-3 list-inside list-decimal space-y-1 text-sm text-gray-700">
              <li><b>Android:</b> εγκατάστησε το MacroDroid (ή το Tasker).</li>
              <li>Trigger: «Incoming call» για οποιονδήποτε αριθμό.</li>
              <li>Action: «HTTP Request» GET στο URL παρακάτω, με τον αριθμό του καλούντα στη θέση του <code>{"{call_number}"}</code>.</li>
              <li>Action: «Notification» με κείμενο το αποτέλεσμα: όνομα, εγκατάσταση, επόμενο ραντεβού, υπόλοιπο.</li>
              <li>Προαιρετικά: «Open website» στην οθόνη κλήσης για πλήρη καρτέλα.</li>
            </ol>
            <p className="mb-1 text-xs text-gray-500">Σύντομο κείμενο για ειδοποίηση:</p>
            <CopyText text={`${origin}/api/lookup?phone={call_number}&${key}`} />
            <p className="mb-1 mt-3 text-xs text-gray-500">Πλήρης οθόνη πελάτη (θέλει σύνδεση στον browser):</p>
            <CopyText text={`${origin}/calls?phone={call_number}`} />
            <p className="mt-3 text-xs text-gray-500"><b>iPhone:</b> το iOS δεν επιτρέπει σε εφαρμογές να διαβάζουν τις εισερχόμενες κλήσεις. Χρησιμοποίησε το .vcf για να εμφανίζεται το όνομα, και τη σελίδα «Κλήσεις» για αναζήτηση.</p>
          </Card>

          <Card title="📅 Ημερολόγιο στο κινητό (Google / Apple Calendar)">
            <p className="mb-2 text-sm text-gray-600">Πρόσθεσε τον σύνδεσμο ως «συνδρομή ημερολογίου από URL». Τα ραντεβού εμφανίζονται στο ημερολόγιο του κινητού.</p>
            <CopyText text={`${origin}/api/calendar.ics?${key}`} />
            {techs.length > 1 && (
              <div className="mt-2 space-y-1">
                {techs.map((t) => (
                  <div key={t.id}>
                    <div className="text-xs text-gray-500">Μόνο {t.name}:</div>
                    <CopyText text={`${origin}/api/calendar.ics?tech=${t.id}&${key}`} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="💾 Αντίγραφα ασφαλείας & εξαγωγές">
            <p className="mb-2 text-sm text-gray-600">
              {counts.c} πελάτες · {counts.j} εργασίες · {counts.f} αρχεία ({(counts.fs / 1024 / 1024).toFixed(1)} MB). Φάκελος δεδομένων: <code className="text-xs">{DATA_DIR}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/api/backup" variant="primary">⬇ Backup βάσης</LinkButton>
              <LinkButton href="/api/export/customers">Πελάτες CSV</LinkButton>
              <LinkButton href="/api/export/jobs">Εργασίες CSV</LinkButton>
              <LinkButton href="/api/export/equipment">Εξοπλισμός CSV</LinkButton>
              <LinkButton href="/api/export/materials">Υλικά CSV</LinkButton>
            </div>
            <p className="mt-2 text-xs text-gray-500">Για πλήρες backup (μαζί με φωτογραφίες) κράτα αντίγραφο ολόκληρου του φακέλου δεδομένων, π.χ. με Hyper Backup στο NAS.</p>
          </Card>

          <Card title="Εγκατάσταση ως εφαρμογή">
            <p className="text-sm text-gray-600">Σε κινητό/tablet άνοιξε την εφαρμογή στον browser και πάτησε «Προσθήκη στην αρχική οθόνη». Ανοίγει σε πλήρη οθόνη, σαν κανονική εφαρμογή.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
