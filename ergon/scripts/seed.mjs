// Δοκιμαστικά δεδομένα: npm run seed   (ΔΕΝ τρέχει αν υπάρχουν ήδη πελάτες, εκτός με --force)
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA } from "../lib/schema.mjs";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
fs.mkdirSync(path.join(DATA_DIR, "files"), { recursive: true });
const db = new Database(path.join(DATA_DIR, "ergon.db"));
db.pragma("foreign_keys = ON");
db.exec(SCHEMA);

if (db.prepare("SELECT COUNT(*) n FROM customers").get().n > 0 && !process.argv.includes("--force")) {
  console.log("Υπάρχουν ήδη δεδομένα — δεν έγινε τίποτα (χρησιμοποίησε --force).");
  process.exit(0);
}

const ins = (table, o) => {
  const k = Object.keys(o);
  return Number(db.prepare(`INSERT INTO ${table} (${k.join(",")}) VALUES (${k.map(() => "?").join(",")})`).run(...k.map((x) => o[x])).lastInsertRowid);
};
const norm = (p) => (p ? p.replace(/\D/g, "").slice(-10) : null);
const TZ = process.env.TZ || "Europe/Athens";
const todayLocal = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const d = (offset) => {
  const x = new Date(todayLocal + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + offset);
  return x.toISOString().slice(0, 10);
};

const set = db.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)");
set.run("business_name", "Τεχνική Εταιρεία (demo)");
set.run("business_owner", "Μηχανολόγος Μηχανικός");
set.run("business_phone", "2310 000000");

const crew = ins("crews", { name: "Συνεργείο Α", color: "#7c3aed" });
const t1 = ins("technicians", { name: "Εγώ", phone: "6900000000", color: "#1f63c8", specialty: "Μηχανικός" });
const t2 = ins("technicians", { name: "Γιώργος", phone: "6900000001", color: "#16a34a", specialty: "Υδραυλικός", crew_id: crew });
const t3 = ins("technicians", { name: "Νίκος", phone: "6900000002", color: "#ea580c", specialty: "Ηλεκτρολόγος", crew_id: crew });

const m1 = ins("materials", { name: "Φίλτρο νερού", unit: "τεμ", unit_cost: 6, unit_price: 12, stock: 20 });
const m2 = ins("materials", { name: "Χαλκοσωλήνας 1/2\"", unit: "μ", unit_cost: 7, unit_price: 12, stock: 50 });
ins("materials", { name: "Ψυκτικό R32", unit: "kg", unit_cost: 25, unit_price: 45, stock: 8 });
ins("materials", { name: "Ακροφύσιο καυστήρα", unit: "τεμ", unit_cost: 9, unit_price: 18, stock: 0 });

const people = [
  ["Μαρία Παπαδοπούλου", "6944123456", "Καλαμαριά", "Μεταμορφώσεως 12", 40.5823, 22.9505, "VIP"],
  ["Γιάννης Νικολάου", "6977345678", "Πυλαία", "Κωνσταντινουπόλεως 50", 40.5992, 22.9867, ""],
  ["Ξενοδοχείο Αύρα", "2310555111", "Περαία", "Παραλία 3", 40.5022, 22.9271, "συμβόλαιο, επαγγελματίας"],
  ["Ελένη Γεωργίου", "6988111222", "Θεσσαλονίκη", "Τσιμισκή 80", 40.6318, 22.9459, ""],
  ["Κώστας Δημητρίου", "6955999000", "Θέρμη", "Αγίου Νικολάου 5", 40.5466, 23.0198, "συμβόλαιο"],
];
const custs = people.map(([name, phone, city, address, lat, lng, tags]) => {
  const c = ins("customers", { name, phone, phone_norm: norm(phone), city, address, tags: tags || null, email: null });
  const i = ins("installations", { customer_id: c, name: name.startsWith("Ξενοδοχείο") ? "Λεβητοστάσιο ξενοδοχείου" : "Κατοικία", type: name.startsWith("Ξενοδοχείο") ? "Ξενοδοχείο" : "Κατοικία", address, city, lat, lng });
  return { c, i };
});
ins("equipment", { installation_id: custs[0].i, kind: "Λέβητας", brand: "Viessmann", model: "Vitodens 100", serial: "VS-77812", installed_at: d(-700), warranty_until: d(20) });
ins("equipment", { installation_id: custs[0].i, kind: "Κλιματιστικό", brand: "Daikin", model: "FTXM35", serial: "DK-4471" });
ins("equipment", { installation_id: custs[2].i, kind: "Καυστήρας", brand: "Riello", model: "RS 50", serial: "RL-90122" });

const job = (o) => ins("jobs", { duration_min: 60, priority: "normal", ...o });
const j1 = job({ customer_id: custs[0].c, installation_id: custs[0].i, title: "Ετήσια συντήρηση λέβητα", type: "Συντήρηση", status: "done", scheduled_at: `${d(-10)}T10:00`, completed_at: `${d(-10)}T11:10`, technician_id: t1, labor_price: 60, work_notes: "Καθαρισμός θαλάμου καύσης, έλεγχος καυσαερίων, αλλαγή φίλτρου." });
ins("job_materials", { job_id: j1, material_id: m1, name: "Φίλτρο νερού", unit: "τεμ", qty: 1, unit_cost: 6, unit_price: 12 });
ins("payments", { customer_id: custs[0].c, job_id: j1, amount: 50, method: "μετρητά", date: d(-10) });
job({ customer_id: custs[1].c, installation_id: custs[1].i, title: "Εγκατάσταση κλιματιστικού", type: "Εγκατάσταση", status: "scheduled", scheduled_at: `${d(0)}T09:30`, duration_min: 180, technician_id: t2, crew_id: crew, labor_price: 150 });
job({ customer_id: custs[3].c, installation_id: custs[3].i, title: "Βλάβη θερμοσίφωνα", type: "Βλάβη", status: "scheduled", priority: "urgent", scheduled_at: `${d(0)}T13:00`, technician_id: t3, labor_price: 40 });
job({ customer_id: custs[4].c, installation_id: custs[4].i, title: "Αυτοψία για φωτοβολταϊκά", type: "Αυτοψία", status: "scheduled", scheduled_at: `${d(2)}T11:00`, technician_id: t1 });
job({ customer_id: custs[2].c, installation_id: custs[2].i, title: "Διαρροή στο λεβητοστάσιο", type: "Βλάβη", status: "pending", priority: "high" });
const j6 = job({ customer_id: custs[2].c, installation_id: custs[2].i, title: "Αντικατάσταση σωληνώσεων", type: "Επισκευή", status: "done", scheduled_at: `${d(-25)}T08:00`, completed_at: `${d(-25)}T15:00`, technician_id: t2, labor_price: 300, duration_min: 420 });
ins("job_materials", { job_id: j6, material_id: m2, name: "Χαλκοσωλήνας 1/2\"", unit: "μ", qty: 18, unit_cost: 7, unit_price: 12 });

ins("contracts", { customer_id: custs[2].c, installation_id: custs[2].i, title: "Εξαμηνιαία συντήρηση καυστήρα", interval_months: 6, next_date: d(12), technician_id: t1, price: 120, annual_fee: 240 });
ins("contracts", { customer_id: custs[4].c, installation_id: custs[4].i, title: "Ετήσια συντήρηση αντλίας θερμότητας", interval_months: 12, next_date: d(90), technician_id: t1, price: 80 });

const q = ins("quotes", { number: `${d(0).slice(0, 4)}-001`, customer_id: custs[4].c, installation_id: custs[4].i, title: "Φωτοβολταϊκό 10kW", status: "sent", issue_date: d(-3), valid_until: d(27), vat_rate: 24, discount: 200 });
ins("quote_items", { quote_id: q, description: "Πάνελ 450W", qty: 22, unit: "τεμ", unit_price: 140, position: 0 });
ins("quote_items", { quote_id: q, description: "Inverter 10kW", qty: 1, unit: "τεμ", unit_price: 1600, position: 1 });
ins("quote_items", { quote_id: q, description: "Εργασία εγκατάστασης & αδειοδότηση", qty: 1, unit: "σετ", unit_price: 1200, position: 2 });

ins("reminders", { title: "Τηλέφωνο για την προσφορά Φ/Β", due_date: d(1), customer_id: custs[4].c });
ins("expenses", { category: "Καύσιμα", description: "Βενζίνη", amount: 45, date: d(-2) });

console.log("✓ Δοκιμαστικά δεδομένα δημιουργήθηκαν στο", DATA_DIR);
