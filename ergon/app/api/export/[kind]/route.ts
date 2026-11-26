export const dynamic = "force-dynamic";
import { all } from "@/lib/db";
import { JOB_TOTAL_SQL } from "@/lib/data";

const csv = (rows: any[]) => {
  if (!rows.length) return "﻿";
  const cols = Object.keys(rows[0]);
  const cell = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // ; ως διαχωριστικό για ελληνικό Excel
  return "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => cell(r[c])).join(";"))].join("\r\n");
};

export async function GET(req: Request, { params }: { params: { kind: string } }) {
  const m = new URL(req.url).searchParams.get("m");
  let rows: any[] = [];
  switch (params.kind) {
    case "customers":
      rows = all("SELECT id, name, company, phone, phone2, email, afm, address, city, tags, notes, created_at FROM customers ORDER BY name");
      break;
    case "jobs":
      rows = all(`SELECT j.id, j.title, j.type, j.status, j.priority, j.scheduled_at, j.duration_min, c.name customer, i.name installation, t.name technician, j.labor_price, ${JOB_TOTAL_SQL} total, j.completed_at, j.work_notes FROM jobs j JOIN customers c ON c.id=j.customer_id LEFT JOIN installations i ON i.id=j.installation_id LEFT JOIN technicians t ON t.id=j.technician_id ORDER BY j.scheduled_at DESC`);
      break;
    case "payments":
      rows = all(`SELECT p.date, c.name customer, p.amount, p.method, p.job_id, p.notes FROM payments p JOIN customers c ON c.id=p.customer_id ${m ? "WHERE substr(p.date,1,7)=?" : ""} ORDER BY p.date`, ...(m ? [m] : []));
      break;
    case "expenses":
      rows = all(`SELECT date, category, description, amount, job_id, notes FROM expenses ${m ? "WHERE substr(date,1,7)=?" : ""} ORDER BY date`, ...(m ? [m] : []));
      break;
    case "equipment":
      rows = all("SELECT c.name customer, i.name installation, e.kind, e.brand, e.model, e.serial, e.installed_at, e.warranty_until, e.notes FROM equipment e JOIN installations i ON i.id=e.installation_id JOIN customers c ON c.id=i.customer_id ORDER BY c.name");
      break;
    case "materials":
      rows = all("SELECT name, code, unit, unit_cost, unit_price, stock, notes FROM materials ORDER BY name");
      break;
    default:
      return new Response("Unknown", { status: 404 });
  }
  return new Response(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${params.kind}${m ? "-" + m : ""}.csv"` },
  });
}
