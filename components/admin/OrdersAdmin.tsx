"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  METHOD, PAY, STATUSES, addressText, ago, btn, btnDark, code, copy, field, fmt, intlPhone, money, stageOf, updateOrder,
  type Order,
} from "@/components/admin/shared";

// Φωτογραφία πελάτη (ιδιωτικός χώρος) με προεπισκόπηση και λήψη.
export function Photo({ path, size = "h-24 w-24" }: { path: string; size?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [dl, setDl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("customer-uploads").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
    supabase.storage.from("customer-uploads").createSignedUrl(path, 3600, { download: true }).then(({ data }) => setDl(data?.signedUrl ?? null));
  }, [path]);
  if (!url) return <div className={`${size} rounded-md border border-line bg-line/40`} />;
  return (
    <div className="flex flex-col gap-1">
      <a href={url} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Φωτογραφία πελάτη" className={`${size} rounded-md border border-line object-cover`} />
      </a>
      {dl && <a href={dl} className="text-[12px] font-medium underline hover:text-ember">⬇ Λήψη</a>}
    </div>
  );
}

function CopyBtn({ text, label = "Αντιγραφή" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copy(text)) {
          setOk(true);
          setTimeout(() => setOk(false), 1300);
        }
      }}
      className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[11.5px] font-medium hover:border-ink"
    >
      {ok ? "✓" : label}
    </button>
  );
}

// Το ένα κουμπί "επόμενο βήμα" για κάθε παραγγελία.
export function NextAction({ o, onDone, compact = false }: { o: Order; onDone: (msg: string) => void; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [askTracking, setAskTracking] = useState(false);
  const [tracking, setTracking] = useState(o.tracking_number ?? "");
  const st = stageOf(o);

  async function run(patch: Record<string, unknown>, notify?: "paid" | "shipped" | "started") {
    setBusy(true);
    const r = await updateOrder(o.id, patch, notify);
    setBusy(false);
    setAskTracking(false);
    onDone(r.msg);
  }

  const cls = compact ? `${btnDark} px-3.5 py-1.5` : btnDark;

  if (st === "await_payment" && o.payment_provider !== "stripe")
    return (
      <button className={cls} disabled={busy} onClick={() => run({ payment_status: "paid", status: "paid" }, "paid")}>
        💶 Ήρθε η πληρωμή
      </button>
    );
  if (st === "to_start")
    return (
      <button className={cls} disabled={busy} onClick={() => run({ status: "processing" }, "started")}>
        🔥 Ξεκίνησα χάραξη
      </button>
    );
  if (st === "engraving")
    return askTracking ? (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run({ status: "shipped", tracking_number: tracking.trim() || null }, "shipped");
        }}
      >
        <input autoFocus className={`${field} w-40 py-1.5`} placeholder="Αρ. αποστολής" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        <button className={cls} disabled={busy} type="submit">📦 Στάλθηκε</button>
        <button type="button" className="text-[12px] text-wood underline" onClick={() => setAskTracking(false)}>άκυρο</button>
      </form>
    ) : (
      <button className={cls} disabled={busy} onClick={() => setAskTracking(true)}>
        📦 Στάλθηκε…
      </button>
    );
  if (st === "shipped")
    return (
      <button className={`${btn} ${compact ? "" : "py-2"}`} disabled={busy} onClick={() => run({ status: "completed" })}>
        ✓ Παραδόθηκε
      </button>
    );
  return null;
}

export function OrderCard({ o, reload, defaultOpen = false }: { o: Order; reload: () => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tracking, setTracking] = useState(o.tracking_number ?? "");
  const [notes, setNotes] = useState(o.admin_notes ?? "");
  const [prodTime, setProdTime] = useState(o.production_time ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const a = o.shipping_address || {};
  const phone = intlPhone(o.customer_phone);
  const link = typeof window !== "undefined" ? `${window.location.origin}/paraggelia/${o.id}` : `/paraggelia/${o.id}`;
  const st = stageOf(o);

  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    const r = await updateOrder(o.id, patch);
    setBusy(false);
    setMsg(r.msg);
    reload();
  }

  async function removeOrder() {
    if (!window.confirm(`Διαγραφή της παραγγελίας #${code(o.id)} του/της ${o.customer_name}; Δεν επαναφέρεται.`)) return;
    setBusy(true);
    const { error } = await supabase.from("orders").delete().eq("id", o.id);
    setBusy(false);
    if (error) { setMsg("Σφάλμα: " + error.message); return; }
    reload();
  }

  const payBadge =
    o.payment_status === "paid"
      ? { t: "Πληρωμένη", c: "bg-[#E3E6D3] text-[#3D4A1F]" }
      : st === "abandoned"
        ? { t: "Δεν πληρώθηκε (κάρτα)", c: "bg-line text-wood" }
        : { t: `Αναμονή ${PAY[o.payment_provider]?.toLowerCase() ?? ""}`, c: "bg-[#F3E3C8] text-[#7A4B0B]" };

  return (
    <div className={`overflow-hidden rounded-xl border bg-paper ${open ? "border-ink/40 shadow-sm" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left">
          <span className="font-semibold tracking-wide">#{code(o.id)}</span>
          <span className="font-medium">{o.customer_name}</span>
          <span className="text-[12.5px] text-wood">{ago(o.created_at)}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${payBadge.c}`}>{payBadge.t}</span>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[11.5px]">{STATUSES[o.status] ?? o.status}</span>
          <span className="w-full truncate text-[12.5px] text-wood md:w-auto">
            {o.order_items.map((i) => `${i.quantity}× ${i.product_name_snapshot}`).join(" · ")}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <b className="text-[15px]">{money(o.total)}</b>
          <NextAction o={o} compact onDone={(m) => { setMsg(m); reload(); }} />
          <button type="button" onClick={() => setOpen((v) => !v)} className="h-8 w-8 rounded-full border border-line text-[12px]" aria-label={open ? "Κλείσιμο" : "Άνοιγμα"}>
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {msg && !open && <div className="border-t border-line px-4 py-2 text-[13px] text-wood">{msg}</div>}

      {open && (
        <div className="flex flex-col gap-5 border-t border-line px-4 py-4 text-[14px]">
          {/* Τι να χαράξω */}
          <div className="flex flex-col gap-4">
            {o.order_items.map((i) => (
              <div key={i.id} className="flex flex-col gap-2.5 rounded-lg bg-[#F7F4EC] p-3.5">
                <div className="flex justify-between gap-3">
                  <b>{i.quantity} × {i.product_name_snapshot}</b>
                  <span>{money(i.line_total)}</span>
                </div>
                {i.custom_design?.fields?.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3 border-t border-line/70 pt-2">
                    <div className="min-w-0">
                      <div className="text-[12px] text-wood">{f.label}</div>
                      <div className="whitespace-pre-wrap break-words text-[16px] font-medium">{f.value}</div>
                    </div>
                    <CopyBtn text={f.value} />
                  </div>
                ))}
                {(i.custom_design?.photos?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-3 border-t border-line/70 pt-2.5">
                    {i.custom_design!.photos!.map((p) => <Photo key={p.path} path={p.path} />)}
                  </div>
                )}
              </div>
            ))}
            {o.notes && (
              <div className="rounded-lg border border-ember/40 bg-ember/5 p-3">
                <b>Σημείωση πελάτη:</b> {o.notes}
              </div>
            )}
          </div>

          {/* Πελάτης & αποστολή */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <b>Πελάτης</b>
              <span>{o.customer_name}</span>
              <span className="text-wood">{o.customer_email}{o.customer_phone ? ` · ${o.customer_phone}` : ""}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {phone && <a className={btn} href={`viber://chat?number=%2B${phone}`}>Viber</a>}
                {phone && <a className={btn} href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                {o.customer_phone && <a className={btn} href={`tel:${o.customer_phone}`}>Κλήση</a>}
                <a className={btn} href={`mailto:${o.customer_email}?subject=${encodeURIComponent(`Η παραγγελία σου #${code(o.id)} — Charaxis`)}`}>Email</a>
                <CopyBtn text={link} label="Σύνδεσμος πελάτη" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <b>{METHOD[o.shipping_method] ?? o.shipping_method} · {money(o.shipping_cost)}</b>
              <span className="whitespace-pre-line text-wood">{[a.address, [a.postcode, a.city].filter(Boolean).join(" ")].filter(Boolean).join("\n")}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                <CopyBtn text={addressText(o)} label="Αντιγραφή για voucher" />
              </div>
              <span className="text-[12.5px] text-wood">{PAY[o.payment_provider] ?? o.payment_provider} · {fmt(o.created_at)}</span>
            </div>
          </div>

          {/* Ενέργειες */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <NextAction o={o} onDone={(m) => { setMsg(m); reload(); }} />
            <a className={btn} href={`/admin/fyllo?ids=${o.id}`} target="_blank" rel="noreferrer">🖨 Φύλλο παραγωγής</a>
          </div>

          <details className="rounded-lg border border-line px-3 py-2">
            <summary className="cursor-pointer text-[13px] font-medium text-wood">Περισσότερα (κατάσταση, σημειώσεις, διαγραφή)</summary>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-wood">Κατάσταση (χειροκίνητα, χωρίς email)</span>
                  <select className={field} value={o.status} onChange={(e) => save({ status: e.target.value })} disabled={busy}>
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-wood">Αρ. αποστολής</span>
                  <input className={field} value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-wood">Χρόνος παραγωγής (το βλέπει ο πελάτης)</span>
                  <input className={field} value={prodTime} onChange={(e) => setProdTime(e.target.value)} placeholder="π.χ. 3–4 εργάσιμες" />
                </label>
              </div>
              <textarea className={field} rows={2} placeholder="Εσωτερικές σημειώσεις (δεν τις βλέπει ο πελάτης)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex flex-wrap items-center gap-2">
                <button className={btnDark} disabled={busy} onClick={() => save({ admin_notes: notes, tracking_number: tracking.trim() || null, production_time: prodTime.trim() || null })}>
                  Αποθήκευση
                </button>
                <button className={`${btn} text-ember-dark`} disabled={busy} onClick={removeOrder}>Διαγραφή παραγγελίας</button>
              </div>
            </div>
          </details>
          {msg && <div className="text-[13px] text-wood">{msg}</div>}
        </div>
      )}
    </div>
  );
}

const FILTERS: { k: string; l: string; f: (o: Order) => boolean }[] = [
  { k: "active", l: "Ενεργές", f: (o) => ["await_payment", "to_start", "engraving", "shipped"].includes(stageOf(o)) },
  { k: "await_payment", l: "Πληρωμή", f: (o) => stageOf(o) === "await_payment" },
  { k: "to_start", l: "Να ξεκινήσω", f: (o) => stageOf(o) === "to_start" },
  { k: "engraving", l: "Στη χάραξη", f: (o) => stageOf(o) === "engraving" },
  { k: "shipped", l: "Καθ' οδόν", f: (o) => stageOf(o) === "shipped" },
  { k: "done", l: "Ολοκληρωμένες", f: (o) => stageOf(o) === "done" },
  { k: "abandoned", l: "Μη πληρωμένες κάρτες", f: (o) => stageOf(o) === "abandoned" },
  { k: "cancelled", l: "Ακυρωμένες", f: (o) => stageOf(o) === "cancelled" },
  { k: "all", l: "Όλες", f: () => true },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function OrdersAdmin({ orders, reload, initialFilter = "active" }: { orders: Order[]; reload: () => void; initialFilter?: string }) {
  const [filter, setFilter] = useState(initialFilter);
  const [q, setQ] = useState("");
  useEffect(() => setFilter(initialFilter), [initialFilter]);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.k === filter) ?? FILTERS[0];
    const nq = norm(q.trim());
    return orders.filter(f.f).filter((o) =>
      !nq ? true : norm(`${code(o.id)} ${o.customer_name} ${o.customer_email} ${o.customer_phone ?? ""} ${o.order_items.map((i) => i.product_name_snapshot).join(" ")}`).includes(nq)
    );
  }, [orders, filter, q]);

  const printable = shown.filter((o) => ["to_start", "engraving"].includes(stageOf(o)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input className={`${field} w-full md:w-80`} placeholder="Αναζήτηση: όνομα, κωδικός, τηλέφωνο, προϊόν" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {printable.length > 0 && (
            <a className={btn} href={`/admin/fyllo?ids=${printable.map((o) => o.id).join(",")}`} target="_blank" rel="noreferrer">
              🖨 Φύλλα για {printable.length} {printable.length === 1 ? "παραγγελία" : "παραγγελίες"}
            </a>
          )}
          <button className={btn} onClick={reload}>↻ Ανανέωση</button>
        </div>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const n = orders.filter(f.f).length;
          if (n === 0 && !["active", "all"].includes(f.k) && filter !== f.k) return null;
          return (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${filter === f.k ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}
            >
              {f.l} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-8 text-center font-serif text-wood">Τίποτα εδώ.</p>}
      {shown.map((o) => (
        <OrderCard key={o.id} o={o} reload={reload} />
      ))}
    </div>
  );
}
