export const TZ = process.env.TZ || "Europe/Athens";

/** Today's date YYYY-MM-DD in local timezone */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function nowLocal(): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}`;
}

export function addDays(date: string, n: number): string {
  const d = new Date(date.slice(0, 10) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function addMonths(date: string, n: number): string {
  const [y, m, day] = date.slice(0, 10).split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}

const MONTHS = ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου", "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"];
export const MONTHS_NOM = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
export const WEEKDAYS = ["Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ", "Κυρ"];
const WEEKDAYS_LONG = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

export function fmtDate(s?: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
export function fmtDateLong(s: string): string {
  const d = new Date(s.slice(0, 10) + "T12:00:00Z");
  return `${WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function fmtDateTime(s?: string | null): string {
  if (!s) return "—";
  const t = s.length > 10 ? s.slice(11, 16) : "";
  return `${fmtDate(s)}${t ? " " + t : ""}`;
}
export function fmtTime(s?: string | null): string {
  return s && s.length > 10 ? s.slice(11, 16) : "";
}
export function money(n?: number | null): string {
  return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(Number(n || 0));
}
export function num(n?: number | null): string {
  return new Intl.NumberFormat("el-GR", { maximumFractionDigits: 2 }).format(Number(n || 0));
}
export function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export const JOB_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Εκκρεμεί", cls: "bg-amber-100 text-amber-800" },
  scheduled: { label: "Προγραμματισμένη", cls: "bg-blue-100 text-blue-800" },
  in_progress: { label: "Σε εξέλιξη", cls: "bg-violet-100 text-violet-800" },
  done: { label: "Ολοκληρώθηκε", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "Ακυρώθηκε", cls: "bg-gray-200 text-gray-600" },
};
export const PRIORITY: Record<string, { label: string; cls: string }> = {
  low: { label: "Χαμηλή", cls: "bg-gray-100 text-gray-700" },
  normal: { label: "Κανονική", cls: "bg-sky-100 text-sky-800" },
  high: { label: "Υψηλή", cls: "bg-orange-100 text-orange-800" },
  urgent: { label: "Επείγον", cls: "bg-red-100 text-red-800" },
};
export const QUOTE_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Πρόχειρη", cls: "bg-gray-100 text-gray-700" },
  sent: { label: "Στάλθηκε", cls: "bg-blue-100 text-blue-800" },
  accepted: { label: "Εγκρίθηκε", cls: "bg-green-100 text-green-800" },
  rejected: { label: "Απορρίφθηκε", cls: "bg-red-100 text-red-800" },
};
export const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Ενεργό", cls: "bg-blue-100 text-blue-800" },
  on_hold: { label: "Σε αναμονή", cls: "bg-amber-100 text-amber-800" },
  done: { label: "Ολοκληρώθηκε", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "Ακυρώθηκε", cls: "bg-gray-200 text-gray-600" },
};
export const PAYMENT_METHODS = ["μετρητά", "κάρτα", "τράπεζα", "IRIS", "επιταγή", "άλλο"];

/** Read helpers for FormData */
export function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
export function numOrNull(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (s == null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
export function intOrNull(fd: FormData, k: string): number | null {
  const n = numOrNull(fd, k);
  return n == null ? null : Math.round(n);
}

export function telHref(p?: string | null) {
  return p ? `tel:${p.replace(/[^\d+]/g, "")}` : undefined;
}
export function mapsHref(r: { lat?: number | null; lng?: number | null; address?: string | null; city?: string | null }) {
  if (r.lat != null && r.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
  const q = [r.address, r.city].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : undefined;
}
