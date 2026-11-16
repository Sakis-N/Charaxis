// Οι παραγγελίες του πελάτη μένουν αποθηκευμένες στη συσκευή του, ώστε να τις
// βρίσκει στη σελίδα /parakolouthisi χωρίς λογαριασμό και χωρίς να ψάχνει email.
const KEY = "charaxis_orders_v1";

export type SavedOrder = { id: string; at: string; total?: number };

export function getSavedOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
    return Array.isArray(list) ? list.filter((o) => o && typeof o.id === "string") : [];
  } catch {
    return [];
  }
}

export function saveOrder(o: SavedOrder) {
  try {
    const list = getSavedOrders().filter((x) => x.id !== o.id);
    list.unshift(o);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export const shortCode = (id: string) => id.replace(/-/g, "").slice(0, 8).toUpperCase();

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
export const extractOrderId = (s: string) => s.match(UUID)?.[0]?.toLowerCase() ?? null;
