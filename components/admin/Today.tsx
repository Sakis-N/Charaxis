"use client";

import { useMemo, useState } from "react";
import { NextAction } from "@/components/admin/OrdersAdmin";
import { STAGES, ago, btn, code, money, stageOf, type Order, type Stage } from "@/components/admin/shared";

type Props = {
  orders: Order[];
  reload: () => void;
  newQuotes: number;
  newMessages: number;
  goto: (tab: "orders" | "quotes" | "messages" | "products", filter?: string) => void;
};

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Η πρώτη οθόνη του admin: τι έχω να κάνω τώρα, σε 4 στήλες, με ένα κουμπί ανά παραγγελία.
export default function Today({ orders, reload, newQuotes, newMessages, goto }: Props) {
  const [flash, setFlash] = useState<string | null>(null);

  const byStage = useMemo(() => {
    const m: Record<Stage, Order[]> = { abandoned: [], await_payment: [], to_start: [], engraving: [], shipped: [], done: [], cancelled: [] };
    for (const o of orders) m[stageOf(o)].push(o);
    // Οι παλαιότερες πρώτα: αυτές βιάζονται.
    for (const k of Object.keys(m) as Stage[]) m[k].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return m;
  }, [orders]);

  const stats = useMemo(() => {
    const counted = orders.filter((o) => o.status !== "cancelled" && (o.payment_status === "paid" || ["paid", "processing", "shipped", "completed"].includes(o.status)));
    const today = startOfDay();
    const week = new Date(today);
    week.setDate(week.getDate() - 6);
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const sum = (from: Date) => {
      const list = counted.filter((o) => new Date(o.created_at) >= from);
      return { n: list.length, total: list.reduce((s, o) => s + Number(o.total), 0) };
    };
    const m = sum(month);
    const top = new Map<string, number>();
    counted
      .filter((o) => new Date(o.created_at) >= month)
      .forEach((o) => o.order_items.forEach((i) => top.set(i.product_name_snapshot, (top.get(i.product_name_snapshot) ?? 0) + i.quantity)));
    const best = Array.from(top.entries()).sort((a, b) => b[1] - a[1])[0];
    return { today: sum(today), week: sum(week), month: m, avg: m.n ? m.total / m.n : 0, best };
  }, [orders]);

  const oldUnpaid = byStage.await_payment.filter((o) => Date.now() - new Date(o.created_at).getTime() > 3 * 864e5);
  const todo = byStage.await_payment.length + byStage.to_start.length + byStage.engraving.length;
  const hello = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Καλημέρα" : h < 18 ? "Καλό απόγευμα" : "Καλησπέρα";
  })();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight md:text-[30px]">{hello} 👋</h2>
          <p className="font-serif text-[16px] text-wood">
            {todo === 0 ? "Όλα είναι εντάξει. Καμία εκκρεμότητα." : `Έχεις ${todo} ${todo === 1 ? "παραγγελία" : "παραγγελίες"} σε εξέλιξη.`}
          </p>
        </div>
        {byStage.to_start.length + byStage.engraving.length > 0 && (
          <a
            className="rounded-full bg-ember px-5 py-2.5 text-[14px] font-semibold text-paper hover:bg-ember-dark"
            href={`/admin/fyllo?ids=${[...byStage.to_start, ...byStage.engraving].map((o) => o.id).join(",")}`}
            target="_blank"
            rel="noreferrer"
          >
            🖨 Φύλλο ημέρας ({byStage.to_start.length + byStage.engraving.length})
          </a>
        )}
      </div>

      {/* Ειδοποιήσεις */}
      {(newQuotes > 0 || newMessages > 0 || oldUnpaid.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {newQuotes > 0 && (
            <button onClick={() => goto("quotes")} className="rounded-xl border border-ember/40 bg-ember/5 px-4 py-3 text-left text-[14px] hover:border-ember">
              💬 <b>{newQuotes}</b> {newQuotes === 1 ? "νέο αίτημα προσφοράς" : "νέα αιτήματα προσφοράς"} →
            </button>
          )}
          {newMessages > 0 && (
            <button onClick={() => goto("messages")} className="rounded-xl border border-ember/40 bg-ember/5 px-4 py-3 text-left text-[14px] hover:border-ember">
              ✉️ <b>{newMessages}</b> {newMessages === 1 ? "μήνυμα χωρίς απάντηση" : "μηνύματα χωρίς απάντηση"} →
            </button>
          )}
          {oldUnpaid.length > 0 && (
            <button onClick={() => goto("orders", "await_payment")} className="rounded-xl border border-line bg-[#F3E3C8]/60 px-4 py-3 text-left text-[14px] hover:border-ink">
              ⏰ <b>{oldUnpaid.length}</b> {oldUnpaid.length === 1 ? "παραγγελία περιμένει" : "παραγγελίες περιμένουν"} πληρωμή πάνω από 3 μέρες →
            </button>
          )}
        </div>
      )}

      {flash && <div className="rounded-lg bg-ink px-4 py-2.5 text-[14px] text-paper">{flash}</div>}

      {/* Οι 4 στήλες δουλειάς */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((s) => {
          const list = byStage[s.key];
          return (
            <section key={s.key} className={`flex flex-col gap-3 rounded-2xl p-4 ${s.tone}`}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[16px] font-semibold">{s.label}</h3>
                <span className="text-[22px] font-semibold">{list.length}</span>
              </div>
              <p className="-mt-2 text-[12.5px] leading-snug text-ink/60">{s.hint}</p>
              {list.length === 0 && <p className="py-3 text-center text-[13px] text-ink/40">—</p>}
              {list.slice(0, 6).map((o) => (
                <div key={o.id} className="flex flex-col gap-2 rounded-xl bg-paper p-3 shadow-sm">
                  <button onClick={() => goto("orders", s.key)} className="flex flex-col gap-0.5 text-left">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{o.customer_name}</span>
                      <span className="shrink-0 text-[13px] font-semibold">{money(o.total)}</span>
                    </span>
                    <span className="truncate text-[12.5px] text-wood">
                      #{code(o.id)} · {ago(o.created_at)}
                    </span>
                    <span className="line-clamp-2 text-[12.5px]">
                      {o.order_items.map((i) => `${i.quantity}× ${i.product_name_snapshot}`).join(" · ")}
                    </span>
                  </button>
                  <NextAction
                    o={o}
                    compact
                    onDone={(m) => {
                      setFlash(`#${code(o.id)}: ${m}`);
                      setTimeout(() => setFlash(null), 4000);
                      reload();
                    }}
                  />
                </div>
              ))}
              {list.length > 6 && (
                <button onClick={() => goto("orders", s.key)} className="text-[13px] font-medium underline">
                  + άλλες {list.length - 6}
                </button>
              )}
            </section>
          );
        })}
      </div>

      {/* Πωλήσεις */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Σήμερα", v: money(stats.today.total), s: `${stats.today.n} παραγγελίες` },
          { l: "7 ημέρες", v: money(stats.week.total), s: `${stats.week.n} παραγγελίες` },
          { l: "Αυτόν τον μήνα", v: money(stats.month.total), s: `${stats.month.n} παραγγελίες` },
          { l: "Μέση παραγγελία (μήνας)", v: money(stats.avg), s: stats.best ? `Top: ${stats.best[0]}` : "—" },
        ].map((c) => (
          <div key={c.l} className="flex flex-col gap-1 rounded-2xl border border-line p-4">
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-wood">{c.l}</span>
            <span className="text-[24px] font-semibold tracking-tight">{c.v}</span>
            <span className="truncate text-[12.5px] text-wood">{c.s}</span>
          </div>
        ))}
      </div>
      <p className="-mt-5 text-[12px] text-faint">Μετράνε μόνο πληρωμένες παραγγελίες (όχι ακυρωμένες).</p>

      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => goto("products")}>+ Νέο προϊόν</button>
        <button className={btn} onClick={() => goto("orders", "all")}>Όλες οι παραγγελίες</button>
        <a className={btn} href="/" target="_blank" rel="noreferrer">Δες το site ↗</a>
      </div>
    </div>
  );
}
