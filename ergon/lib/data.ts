import fs from "fs";
import path from "path";
import crypto from "crypto";
import { all, get, insert, run, update, FILES_DIR, Row } from "./db";
import { addDays, addMonths, today } from "./util";

export const INSTALLATION_FILE_LIMIT = 50 * 1024 * 1024; // 50MB ανά εγκατάσταση

/** SQL expression: total charge of a job (labor + materials) */
export const JOB_TOTAL_SQL = `(COALESCE(j.labor_price,0) + COALESCE((SELECT SUM(qty*unit_price) FROM job_materials m WHERE m.job_id=j.id),0))`;

export function jobTotal(jobId: number): { labor: number; materials: number; cost: number; total: number } {
  const j = get<Row>("SELECT labor_price FROM jobs WHERE id=?", jobId);
  const m = get<Row>("SELECT COALESCE(SUM(qty*unit_price),0) p, COALESCE(SUM(qty*unit_cost),0) c FROM job_materials WHERE job_id=?", jobId)!;
  const labor = Number(j?.labor_price || 0);
  return { labor, materials: m.p, cost: m.c, total: labor + m.p };
}

export function customerBalance(customerId: number) {
  const charged = get<Row>(
    `SELECT COALESCE(SUM(${JOB_TOTAL_SQL}),0) t FROM jobs j WHERE j.customer_id=? AND j.status='done'`,
    customerId,
  )!.t as number;
  const paid = get<Row>("SELECT COALESCE(SUM(amount),0) t FROM payments WHERE customer_id=?", customerId)!.t as number;
  return { charged, paid, balance: charged - paid };
}

export function balances(): Row[] {
  return all(
    `SELECT c.id, c.name, c.phone,
      COALESCE((SELECT SUM(${JOB_TOTAL_SQL}) FROM jobs j WHERE j.customer_id=c.id AND j.status='done'),0) AS charged,
      COALESCE((SELECT SUM(amount) FROM payments p WHERE p.customer_id=c.id),0) AS paid
     FROM customers c`,
  )
    .map((r) => ({ ...r, balance: r.charged - r.paid }))
    .filter((r) => Math.abs(r.balance) > 0.005)
    .sort((a, b) => b.balance - a.balance);
}

export function quoteTotals(quoteId: number) {
  const q = get<Row>("SELECT vat_rate, discount FROM quotes WHERE id=?", quoteId);
  const sub = get<Row>("SELECT COALESCE(SUM(qty*unit_price),0) s FROM quote_items WHERE quote_id=?", quoteId)!.s as number;
  const discount = Number(q?.discount || 0);
  const net = sub - discount;
  const vat = (net * Number(q?.vat_rate ?? 24)) / 100;
  return { sub, discount, net, vat, total: net + vat };
}

export function nextQuoteNumber(): string {
  const y = today().slice(0, 4);
  const r = get<Row>("SELECT COUNT(*) n FROM quotes WHERE number LIKE ?", `${y}-%`)!;
  return `${y}-${String(r.n + 1).padStart(3, "0")}`;
}

/**
 * Αυτόματος προγραμματισμός συντηρήσεων: για κάθε ενεργό συμβόλαιο, δημιουργεί εργασίες
 * για όσες επισκέψεις πέφτουν μέσα στις επόμενες `lookaheadDays` ημέρες.
 */
export function syncContracts(lookaheadDays = 45): number {
  const horizon = addDays(today(), lookaheadDays);
  const contracts = all("SELECT * FROM contracts WHERE active=1 AND next_date <= ?", horizon);
  let created = 0;
  for (const c of contracts) {
    let next: string = c.next_date;
    let guard = 0;
    while (next <= horizon && guard++ < 24) {
      if (c.end_date && next > c.end_date) {
        run("UPDATE contracts SET active=0 WHERE id=?", c.id);
        break;
      }
      const exists = get("SELECT id FROM jobs WHERE contract_id=? AND substr(scheduled_at,1,10)=?", c.id, next);
      if (!exists) {
        insert("jobs", {
          customer_id: c.customer_id,
          installation_id: c.installation_id,
          contract_id: c.id,
          title: c.title,
          description: c.description,
          type: "Συντήρηση",
          status: "scheduled",
          scheduled_at: `${next}T${c.visit_time || "09:00"}`,
          duration_min: c.duration_min || 60,
          technician_id: c.technician_id,
          crew_id: c.crew_id,
          labor_price: c.price || 0,
        });
        created++;
      }
      next = addMonths(next, Math.max(1, c.interval_months));
    }
    run("UPDATE contracts SET next_date=? WHERE id=?", next, c.id);
  }
  return created;
}

export function installationFilesSize(installationId: number): number {
  return get<Row>(
    `SELECT COALESCE(SUM(size),0) s FROM files WHERE installation_id=?
       OR job_id IN (SELECT id FROM jobs WHERE installation_id=?)`,
    installationId,
    installationId,
  )!.s as number;
}

export async function saveFiles(
  files: File[],
  owner: { customer_id?: number | null; installation_id?: number | null; job_id?: number | null },
  caption?: string | null,
): Promise<{ saved: number; error?: string }> {
  const real = files.filter((f) => f && typeof f === "object" && f.size > 0);
  if (!real.length) return { saved: 0 };
  let instId = owner.installation_id ?? null;
  if (!instId && owner.job_id) instId = get<Row>("SELECT installation_id FROM jobs WHERE id=?", owner.job_id)?.installation_id ?? null;
  if (instId) {
    const used = installationFilesSize(instId);
    const incoming = real.reduce((s, f) => s + f.size, 0);
    if (used + incoming > INSTALLATION_FILE_LIMIT) {
      return { saved: 0, error: "Ξεπερνιέται το όριο των 50MB για αυτή την εγκατάσταση." };
    }
  }
  fs.mkdirSync(FILES_DIR, { recursive: true });
  for (const f of real) {
    const ext = path.extname(f.name).slice(0, 10).toLowerCase();
    const stored = crypto.randomBytes(12).toString("hex") + ext;
    fs.writeFileSync(path.join(FILES_DIR, stored), Buffer.from(await f.arrayBuffer()));
    insert("files", {
      customer_id: owner.customer_id ?? null,
      installation_id: owner.job_id ? null : instId,
      job_id: owner.job_id ?? null,
      filename: f.name,
      stored_name: stored,
      mime: f.type || "application/octet-stream",
      size: f.size,
      caption: caption ?? null,
    });
  }
  return { saved: real.length };
}

export function deleteFile(id: number) {
  const f = get<Row>("SELECT * FROM files WHERE id=?", id);
  if (!f) return;
  try {
    fs.unlinkSync(path.join(FILES_DIR, f.stored_name));
  } catch {}
  run("DELETE FROM files WHERE id=?", id);
}

/** Apply stock movement when materials are used on a job */
export function adjustStock(materialId: number | null, delta: number) {
  if (!materialId) return;
  run("UPDATE materials SET stock = COALESCE(stock,0) + ? WHERE id=?", delta, materialId);
}

export function setJobStatus(id: number, status: string) {
  const data: Row = { status };
  if (status === "done") data.completed_at = new Date().toISOString().slice(0, 16);
  update("jobs", id, data);
}

export function selectOptions() {
  return {
    customers: all("SELECT id, name, company FROM customers ORDER BY name COLLATE NOCASE"),
    installations: all("SELECT id, customer_id, name FROM installations ORDER BY name COLLATE NOCASE"),
    projects: all("SELECT id, customer_id, name FROM projects WHERE status IN ('active','on_hold') ORDER BY name"),
    technicians: all("SELECT id, name, color FROM technicians WHERE active=1 ORDER BY name"),
    crews: all("SELECT id, name, color FROM crews ORDER BY name"),
    materials: all("SELECT id, name, unit, unit_cost, unit_price, stock FROM materials ORDER BY name COLLATE NOCASE"),
  };
}

/** Standard job listing query; append WHERE/ORDER via `where` */
export function jobList(where = "1=1", params: any[] = [], order = "j.scheduled_at IS NULL, j.scheduled_at", limit = 500): Row[] {
  return all(
    `SELECT j.*, c.name AS customer_name, c.phone AS customer_phone, i.name AS installation_name,
       COALESCE(i.city, c.city) AS city, i.lat, i.lng, COALESCE(i.address, c.address) AS address,
       t.name AS technician_name, t.color AS technician_color, cr.name AS crew_name, cr.color AS crew_color,
       ${JOB_TOTAL_SQL} AS total
     FROM jobs j
     JOIN customers c ON c.id=j.customer_id
     LEFT JOIN installations i ON i.id=j.installation_id
     LEFT JOIN technicians t ON t.id=j.technician_id
     LEFT JOIN crews cr ON cr.id=j.crew_id
     WHERE ${where}
     ORDER BY ${order}
     LIMIT ${limit}`,
    ...params,
  );
}
