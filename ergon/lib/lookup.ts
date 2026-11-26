import { all, get, insert, normPhone, Row } from "./db";
import { customerBalance } from "./data";
import { today } from "./util";

export function findCustomerByPhone(phone: string): Row | undefined {
  const n = normPhone(phone);
  if (!n || n.length < 6) return undefined;
  return get("SELECT * FROM customers WHERE phone_norm=? OR phone2_norm=? OR phone_norm LIKE ? LIMIT 1", n, n, `%${n}`);
}

export function callerInfo(phone: string, log = true) {
  const c = findCustomerByPhone(phone);
  if (log && phone) insert("calls", { phone, customer_id: c?.id ?? null });
  if (!c) return { found: false as const, phone };
  const next = get(
    "SELECT id, title, scheduled_at FROM jobs WHERE customer_id=? AND status IN ('scheduled','pending','in_progress') AND (scheduled_at IS NULL OR substr(scheduled_at,1,10)>=?) ORDER BY scheduled_at IS NULL, scheduled_at LIMIT 1",
    c.id,
    today(),
  );
  const last = get("SELECT id, title, scheduled_at FROM jobs WHERE customer_id=? AND status='done' ORDER BY COALESCE(completed_at, scheduled_at) DESC LIMIT 1", c.id);
  const inst = all("SELECT name, city FROM installations WHERE customer_id=? LIMIT 3", c.id);
  const bal = customerBalance(c.id);
  return { found: true as const, phone, customer: c, next, last, installations: inst, balance: bal.balance };
}
