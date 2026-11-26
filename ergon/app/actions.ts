"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { all, get, insert, normPhone, run, setSetting, update, Row } from "@/lib/db";
import { adjustStock, deleteFile, nextQuoteNumber, saveFiles, setJobStatus } from "@/lib/data";
import { COOKIE, SESSION_MAX_AGE, checkPassword, createSessionValue } from "@/lib/auth";
import { addMonths, intOrNull, numOrNull, str, today } from "@/lib/util";

const done = (path: string) => {
  revalidatePath("/", "layout");
  redirect(path);
};
const back = (fd: FormData, fallback: string) => str(fd, "_back") || fallback;
const idOf = (fd: FormData) => Number(fd.get("id"));

/* ---------- auth ---------- */
export async function login(fd: FormData) {
  const pw = String(fd.get("password") || "");
  const next = str(fd, "next") || "/";
  if (!checkPassword(pw)) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  cookies().set(COOKIE, await createSessionValue(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  redirect(next.startsWith("/") ? next : "/");
}
export async function logout() {
  cookies().delete(COOKIE);
  redirect("/login");
}

/* ---------- customers ---------- */
function customerData(fd: FormData) {
  const phone = str(fd, "phone");
  const phone2 = str(fd, "phone2");
  return {
    name: str(fd, "name") || "Χωρίς όνομα",
    company: str(fd, "company"),
    phone,
    phone2,
    phone_norm: normPhone(phone),
    phone2_norm: normPhone(phone2),
    email: str(fd, "email"),
    afm: str(fd, "afm"),
    address: str(fd, "address"),
    city: str(fd, "city"),
    tags: str(fd, "tags"),
    notes: str(fd, "notes"),
  };
}
export async function saveCustomer(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = customerData(fd);
  let cid = id;
  if (id) update("customers", id, data);
  else cid = insert("customers", data);
  if (!id && fd.get("create_installation")) {
    insert("installations", { customer_id: cid, name: str(fd, "address") || "Κύρια εγκατάσταση", address: data.address, city: data.city });
  }
  done(`/customers/${cid}`);
}
export async function deleteCustomer(fd: FormData) {
  const id = idOf(fd);
  for (const f of all("SELECT id FROM files WHERE customer_id=? OR job_id IN (SELECT id FROM jobs WHERE customer_id=?) OR installation_id IN (SELECT id FROM installations WHERE customer_id=?)", id, id, id)) deleteFile(f.id);
  run("DELETE FROM customers WHERE id=?", id);
  done("/customers");
}

/* ---------- installations ---------- */
export async function saveInstallation(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    customer_id: Number(fd.get("customer_id")),
    name: str(fd, "name") || "Εγκατάσταση",
    type: str(fd, "type"),
    address: str(fd, "address"),
    city: str(fd, "city"),
    lat: numOrNull(fd, "lat"),
    lng: numOrNull(fd, "lng"),
    notes: str(fd, "notes"),
  };
  let iid = id;
  if (id) update("installations", id, data);
  else iid = insert("installations", data);
  done(`/installations/${iid}`);
}
export async function deleteInstallation(fd: FormData) {
  const id = idOf(fd);
  const inst = get("SELECT customer_id FROM installations WHERE id=?", id);
  for (const f of all("SELECT id FROM files WHERE installation_id=?", id)) deleteFile(f.id);
  run("DELETE FROM installations WHERE id=?", id);
  done(`/customers/${inst?.customer_id ?? ""}`);
}

/* ---------- equipment ---------- */
export async function saveEquipment(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    installation_id: Number(fd.get("installation_id")),
    kind: str(fd, "kind") || "Εξοπλισμός",
    brand: str(fd, "brand"),
    model: str(fd, "model"),
    serial: str(fd, "serial"),
    installed_at: str(fd, "installed_at"),
    warranty_until: str(fd, "warranty_until"),
    notes: str(fd, "notes"),
  };
  if (id) update("equipment", id, data);
  else insert("equipment", data);
  done(`/installations/${data.installation_id}`);
}
export async function deleteEquipment(fd: FormData) {
  const e = get("SELECT installation_id FROM equipment WHERE id=?", idOf(fd));
  run("DELETE FROM equipment WHERE id=?", idOf(fd));
  done(`/installations/${e?.installation_id}`);
}

/* ---------- projects ---------- */
export async function saveProject(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    customer_id: Number(fd.get("customer_id")),
    installation_id: intOrNull(fd, "installation_id"),
    name: str(fd, "name") || "Έργο",
    status: str(fd, "status") || "active",
    description: str(fd, "description"),
    start_date: str(fd, "start_date"),
    end_date: str(fd, "end_date"),
    budget: numOrNull(fd, "budget"),
  };
  let pid = id;
  if (id) update("projects", id, data);
  else pid = insert("projects", data);
  done(`/projects/${pid}`);
}
export async function deleteProject(fd: FormData) {
  run("DELETE FROM projects WHERE id=?", idOf(fd));
  done("/projects");
}

/* ---------- team ---------- */
export async function saveTechnician(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    name: str(fd, "name") || "Τεχνικός",
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    specialty: str(fd, "specialty"),
    color: str(fd, "color") || "#16a34a",
    crew_id: intOrNull(fd, "crew_id"),
    active: fd.get("active") ? 1 : 0,
  };
  if (id) update("technicians", id, data);
  else insert("technicians", { ...data, active: 1 });
  done("/team");
}
export async function deleteTechnician(fd: FormData) {
  run("DELETE FROM technicians WHERE id=?", idOf(fd));
  done("/team");
}
export async function saveCrew(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = { name: str(fd, "name") || "Συνεργείο", color: str(fd, "color") || "#2f7ae5", notes: str(fd, "notes") };
  if (id) update("crews", id, data);
  else insert("crews", data);
  done("/team");
}
export async function deleteCrew(fd: FormData) {
  run("DELETE FROM crews WHERE id=?", idOf(fd));
  done("/team");
}

/* ---------- jobs ---------- */
function jobData(fd: FormData): Row {
  const date = str(fd, "date");
  const time = str(fd, "time");
  const status = str(fd, "status") || (date ? "scheduled" : "pending");
  return {
    customer_id: Number(fd.get("customer_id")),
    installation_id: intOrNull(fd, "installation_id"),
    project_id: intOrNull(fd, "project_id"),
    title: str(fd, "title") || "Εργασία",
    description: str(fd, "description"),
    type: str(fd, "type"),
    status,
    priority: str(fd, "priority") || "normal",
    scheduled_at: date ? `${date}T${time || "09:00"}` : null,
    duration_min: intOrNull(fd, "duration_min") ?? 60,
    technician_id: intOrNull(fd, "technician_id"),
    crew_id: intOrNull(fd, "crew_id"),
    labor_price: numOrNull(fd, "labor_price") ?? 0,
  };
}
export async function saveJob(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = jobData(fd);
  let jid = id;
  if (id) {
    const prev = get("SELECT status FROM jobs WHERE id=?", id);
    update("jobs", id, data);
    if (prev?.status !== data.status) setJobStatus(id, data.status);
  } else {
    jid = insert("jobs", data);
    if (data.status === "done") setJobStatus(jid!, "done");
  }
  done(`/jobs/${jid}`);
}
export async function duplicateJob(fd: FormData) {
  const j = get("SELECT * FROM jobs WHERE id=?", idOf(fd));
  if (!j) return;
  const nid = insert("jobs", {
    customer_id: j.customer_id,
    installation_id: j.installation_id,
    project_id: j.project_id,
    title: j.title,
    description: j.description,
    type: j.type,
    status: "pending",
    priority: j.priority,
    duration_min: j.duration_min,
    technician_id: j.technician_id,
    crew_id: j.crew_id,
    labor_price: j.labor_price,
  });
  done(`/jobs/${nid}/edit`);
}
export async function setJobStatusAction(fd: FormData) {
  setJobStatus(idOf(fd), String(fd.get("status")));
  done(back(fd, `/jobs/${idOf(fd)}`));
}
export async function rescheduleJob(fd: FormData) {
  const id = idOf(fd);
  const date = str(fd, "date");
  const time = str(fd, "time") || "09:00";
  update("jobs", id, { scheduled_at: date ? `${date}T${time}` : null, status: date ? "scheduled" : "pending" });
  done(back(fd, `/jobs/${id}`));
}
export async function saveJobNotes(fd: FormData) {
  const id = idOf(fd);
  update("jobs", id, { work_notes: str(fd, "work_notes"), tech_notes: str(fd, "tech_notes") });
  done(`/jobs/${id}`);
}
export async function deleteJob(fd: FormData) {
  const id = idOf(fd);
  const j = get("SELECT customer_id FROM jobs WHERE id=?", id);
  for (const f of all("SELECT id FROM files WHERE job_id=?", id)) deleteFile(f.id);
  for (const m of all("SELECT material_id, qty FROM job_materials WHERE job_id=?", id)) adjustStock(m.material_id, m.qty);
  run("DELETE FROM jobs WHERE id=?", id);
  done(j ? `/customers/${j.customer_id}` : "/jobs");
}
export async function signJob(fd: FormData) {
  const id = idOf(fd);
  const sig = str(fd, "signature");
  if (sig?.startsWith("data:image/png")) update("jobs", id, { signature: sig, signed_by: str(fd, "signed_by"), signed_at: new Date().toISOString() });
  done(`/jobs/${id}`);
}
export async function clearJobSignature(fd: FormData) {
  update("jobs", idOf(fd), { signature: null, signed_by: null, signed_at: null });
  done(`/jobs/${idOf(fd)}`);
}
export async function addJobMaterial(fd: FormData) {
  const jobId = Number(fd.get("job_id"));
  const materialId = intOrNull(fd, "material_id");
  const qty = numOrNull(fd, "qty") ?? 1;
  const mat = materialId ? get("SELECT * FROM materials WHERE id=?", materialId) : null;
  insert("job_materials", {
    job_id: jobId,
    material_id: materialId,
    name: str(fd, "name") || mat?.name || "Υλικό",
    unit: str(fd, "unit") || mat?.unit || null,
    qty,
    unit_cost: numOrNull(fd, "unit_cost") ?? mat?.unit_cost ?? 0,
    unit_price: numOrNull(fd, "unit_price") ?? mat?.unit_price ?? 0,
  });
  adjustStock(materialId, -qty);
  done(`/jobs/${jobId}`);
}
export async function deleteJobMaterial(fd: FormData) {
  const m = get("SELECT * FROM job_materials WHERE id=?", idOf(fd));
  if (m) {
    adjustStock(m.material_id, m.qty);
    run("DELETE FROM job_materials WHERE id=?", m.id);
  }
  done(`/jobs/${m?.job_id}`);
}

/* ---------- files ---------- */
export async function uploadFiles(fd: FormData) {
  const files = fd.getAll("files") as File[];
  const owner = {
    customer_id: intOrNull(fd, "customer_id"),
    installation_id: intOrNull(fd, "installation_id"),
    job_id: intOrNull(fd, "job_id"),
  };
  const r = await saveFiles(files, owner, str(fd, "caption"));
  const to = back(fd, "/");
  if (r.error) {
    revalidatePath("/", "layout");
    redirect(`${to}${to.includes("?") ? "&" : "?"}err=${encodeURIComponent(r.error)}`);
  }
  done(to);
}
export async function removeFile(fd: FormData) {
  deleteFile(idOf(fd));
  done(back(fd, "/"));
}

/* ---------- payments & expenses ---------- */
export async function savePayment(fd: FormData) {
  insert("payments", {
    customer_id: Number(fd.get("customer_id")),
    job_id: intOrNull(fd, "job_id"),
    amount: numOrNull(fd, "amount") ?? 0,
    method: str(fd, "method") || "μετρητά",
    date: str(fd, "date") || today(),
    notes: str(fd, "notes"),
  });
  done(back(fd, "/finance"));
}
export async function deletePayment(fd: FormData) {
  run("DELETE FROM payments WHERE id=?", idOf(fd));
  done(back(fd, "/finance"));
}
export async function saveExpense(fd: FormData) {
  insert("expenses", {
    category: str(fd, "category"),
    description: str(fd, "description") || "Έξοδο",
    amount: numOrNull(fd, "amount") ?? 0,
    date: str(fd, "date") || today(),
    job_id: intOrNull(fd, "job_id"),
    notes: str(fd, "notes"),
  });
  done(back(fd, "/finance"));
}
export async function deleteExpense(fd: FormData) {
  run("DELETE FROM expenses WHERE id=?", idOf(fd));
  done(back(fd, "/finance"));
}

/* ---------- materials ---------- */
export async function saveMaterial(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    name: str(fd, "name") || "Υλικό",
    code: str(fd, "code"),
    unit: str(fd, "unit") || "τεμ",
    unit_cost: numOrNull(fd, "unit_cost") ?? 0,
    unit_price: numOrNull(fd, "unit_price") ?? 0,
    stock: numOrNull(fd, "stock") ?? 0,
    notes: str(fd, "notes"),
  };
  if (id) update("materials", id, data);
  else insert("materials", data);
  done("/materials");
}
export async function deleteMaterial(fd: FormData) {
  run("DELETE FROM materials WHERE id=?", idOf(fd));
  done("/materials");
}

/* ---------- contracts (επαναλαμβανόμενες συντηρήσεις) ---------- */
export async function saveContract(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    customer_id: Number(fd.get("customer_id")),
    installation_id: intOrNull(fd, "installation_id"),
    title: str(fd, "title") || "Συντήρηση",
    description: str(fd, "description"),
    interval_months: intOrNull(fd, "interval_months") ?? 12,
    next_date: str(fd, "next_date") || today(),
    visit_time: str(fd, "visit_time") || "09:00",
    duration_min: intOrNull(fd, "duration_min") ?? 60,
    technician_id: intOrNull(fd, "technician_id"),
    crew_id: intOrNull(fd, "crew_id"),
    price: numOrNull(fd, "price") ?? 0,
    annual_fee: numOrNull(fd, "annual_fee") ?? 0,
    start_date: str(fd, "start_date"),
    end_date: str(fd, "end_date"),
    active: fd.get("active") ? 1 : 0,
    notes: str(fd, "notes"),
  };
  if (id) update("contracts", id, data);
  else insert("contracts", { ...data, active: 1 });
  done("/contracts");
}
export async function deleteContract(fd: FormData) {
  run("DELETE FROM contracts WHERE id=?", idOf(fd));
  done("/contracts");
}
export async function skipContractVisit(fd: FormData) {
  const c = get("SELECT * FROM contracts WHERE id=?", idOf(fd));
  if (c) update("contracts", c.id, { next_date: addMonths(c.next_date, c.interval_months) });
  done("/contracts");
}

/* ---------- reminders ---------- */
export async function saveReminder(fd: FormData) {
  insert("reminders", {
    title: str(fd, "title") || "Υπενθύμιση",
    due_date: str(fd, "due_date") || today(),
    customer_id: intOrNull(fd, "customer_id"),
    job_id: intOrNull(fd, "job_id"),
    notes: str(fd, "notes"),
  });
  done(back(fd, "/reminders"));
}
export async function toggleReminder(fd: FormData) {
  run("UPDATE reminders SET done = 1 - done WHERE id=?", idOf(fd));
  done(back(fd, "/reminders"));
}
export async function deleteReminder(fd: FormData) {
  run("DELETE FROM reminders WHERE id=?", idOf(fd));
  done(back(fd, "/reminders"));
}

/* ---------- quotes ---------- */
function saveQuoteItems(quoteId: number, fd: FormData) {
  const d = fd.getAll("item_description").map(String);
  const q = fd.getAll("item_qty").map(String);
  const u = fd.getAll("item_unit").map(String);
  const p = fd.getAll("item_price").map(String);
  run("DELETE FROM quote_items WHERE quote_id=?", quoteId);
  d.forEach((desc, i) => {
    if (!desc.trim()) return;
    insert("quote_items", {
      quote_id: quoteId,
      description: desc.trim(),
      qty: Number((q[i] || "1").replace(",", ".")) || 0,
      unit: u[i] || null,
      unit_price: Number((p[i] || "0").replace(",", ".")) || 0,
      position: i,
    });
  });
}
export async function saveQuote(fd: FormData) {
  const id = intOrNull(fd, "id");
  const data = {
    customer_id: Number(fd.get("customer_id")),
    installation_id: intOrNull(fd, "installation_id"),
    title: str(fd, "title") || "Προσφορά",
    status: str(fd, "status") || "draft",
    issue_date: str(fd, "issue_date") || today(),
    valid_until: str(fd, "valid_until"),
    vat_rate: numOrNull(fd, "vat_rate") ?? 24,
    discount: numOrNull(fd, "discount") ?? 0,
    notes: str(fd, "notes"),
    terms: str(fd, "terms"),
  };
  let qid = id;
  if (id) update("quotes", id, data);
  else qid = insert("quotes", { ...data, number: nextQuoteNumber() });
  saveQuoteItems(qid!, fd);
  done(`/quotes/${qid}`);
}
export async function setQuoteStatus(fd: FormData) {
  update("quotes", idOf(fd), { status: String(fd.get("status")) });
  done(`/quotes/${idOf(fd)}`);
}
export async function signQuote(fd: FormData) {
  const id = idOf(fd);
  const sig = str(fd, "signature");
  if (sig?.startsWith("data:image/png")) update("quotes", id, { signature: sig, signed_by: str(fd, "signed_by"), signed_at: new Date().toISOString(), status: "accepted" });
  done(`/quotes/${id}`);
}
export async function clearQuoteSignature(fd: FormData) {
  update("quotes", idOf(fd), { signature: null, signed_by: null, signed_at: null });
  done(`/quotes/${idOf(fd)}`);
}
export async function deleteQuote(fd: FormData) {
  run("DELETE FROM quotes WHERE id=?", idOf(fd));
  done("/quotes");
}
export async function duplicateQuote(fd: FormData) {
  const q = get("SELECT * FROM quotes WHERE id=?", idOf(fd));
  if (!q) return;
  const nid = insert("quotes", {
    number: nextQuoteNumber(),
    customer_id: q.customer_id,
    installation_id: q.installation_id,
    title: q.title,
    status: "draft",
    issue_date: today(),
    vat_rate: q.vat_rate,
    discount: q.discount,
    notes: q.notes,
    terms: q.terms,
  });
  for (const it of all("SELECT * FROM quote_items WHERE quote_id=? ORDER BY position", q.id)) {
    insert("quote_items", { quote_id: nid, description: it.description, qty: it.qty, unit: it.unit, unit_price: it.unit_price, position: it.position });
  }
  done(`/quotes/${nid}/edit`);
}
/** Μετατροπή εγκεκριμένης προσφοράς σε εργασία (με τα είδη ως υλικά/εργασία) */
export async function quoteToJob(fd: FormData) {
  const q = get("SELECT * FROM quotes WHERE id=?", idOf(fd));
  if (!q) return;
  const items = all("SELECT * FROM quote_items WHERE quote_id=? ORDER BY position", q.id);
  const jid = insert("jobs", {
    customer_id: q.customer_id,
    installation_id: q.installation_id,
    quote_id: q.id,
    title: q.title,
    description: `Από προσφορά ${q.number}${q.notes ? "\n" + q.notes : ""}`,
    status: "pending",
    labor_price: 0,
  });
  for (const it of items) insert("job_materials", { job_id: jid, name: it.description, unit: it.unit, qty: it.qty, unit_price: it.unit_price });
  if (Number(q.discount) > 0) insert("job_materials", { job_id: jid, name: "Έκπτωση προσφοράς", qty: 1, unit_price: -Number(q.discount) });
  update("quotes", q.id, { job_id: jid, status: "accepted" });
  done(`/jobs/${jid}/edit`);
}

/* ---------- settings ---------- */
export async function saveSettings(fd: FormData) {
  for (const k of ["business_name", "business_owner", "business_afm", "business_doy", "business_address", "business_phone", "business_email", "business_website", "default_vat", "quote_terms", "report_footer", "job_types", "expense_categories", "country_prefix"]) {
    setSetting(k, str(fd, k) ?? "");
  }
  done("/settings?saved=1");
}

/* ---------- calls ---------- */
export async function logCall(fd: FormData) {
  const phone = str(fd, "phone") || "";
  const n = normPhone(phone);
  const c = n ? get("SELECT id FROM customers WHERE phone_norm=? OR phone2_norm=?", n, n) : null;
  insert("calls", { phone, customer_id: c?.id ?? null });
  done(back(fd, "/calls"));
}

/** Drag & drop στο ημερολόγιο: μεταφορά εργασίας σε άλλη ημέρα (κρατά την ώρα) */
export async function moveJobToDate(id: number, date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const j = get("SELECT scheduled_at FROM jobs WHERE id=?", id);
  if (!j) return;
  const time = j.scheduled_at ? String(j.scheduled_at).slice(11, 16) : "09:00";
  run("UPDATE jobs SET scheduled_at=?, status=CASE WHEN status='pending' THEN 'scheduled' ELSE status END WHERE id=?", `${date}T${time}`, id);
  revalidatePath("/", "layout");
}
