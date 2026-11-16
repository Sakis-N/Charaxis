"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import SettingsAdmin from "@/components/admin/SettingsAdmin";
import OrdersAdmin, { Photo } from "@/components/admin/OrdersAdmin";
import Today from "@/components/admin/Today";
import { btn, btnDark, code, field, fmt, stageOf, type Order } from "@/components/admin/shared";

type Quote = {
  id: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string | null;
  description: string; reference_image_url: string | null; status: string; quoted_price: number | null; admin_notes: string | null;
};
type Msg = { id: string; created_at: string; name: string; email: string; message: string; handled: boolean };
type Coupon = { id: string; code: string; discount_type: string; discount_value: number; max_uses: number | null; times_used: number; expires_at: string | null; active: boolean };

const QSTATUS: Record<string, string> = { new: "Νέο", quoted: "Στάλθηκε προσφορά", accepted: "Έγινε δεκτό", declined: "Απορρίφθηκε", completed: "Ολοκληρώθηκε" };

function QuoteCard({ q, reload }: { q: Quote; reload: () => void }) {
  const [price, setPrice] = useState(q.quoted_price?.toString() ?? "");
  const [notes, setNotes] = useState(q.admin_notes ?? "");
  const [status, setStatus] = useState(q.status);
  const [msg, setMsg] = useState<string | null>(null);
  async function save(nextStatus = status) {
    const { error } = await supabase.from("quote_requests").update({
      status: nextStatus, admin_notes: notes, quoted_price: price.trim() === "" ? null : Number(price.replace(",", ".")),
    }).eq("id", q.id);
    setMsg(error ? error.message : "Αποθηκεύτηκε ✓");
    reload();
  }
  // Έτοιμο email προσφοράς: ανοίγει το email σου συμπληρωμένο, εσύ απλώς πατάς αποστολή.
  const mail = `mailto:${q.customer_email}?subject=${encodeURIComponent("Η προσφορά σου από το Charaxis")}&body=${encodeURIComponent(
    `Γεια σου ${q.customer_name.split(" ")[0]},\n\nευχαριστούμε για το μήνυμά σου!\n\nΓια αυτό που περιέγραψες, η τιμή είναι ${price || "…"} € (μαζί με τη χάραξη).\n\nΑν σου ταιριάζει, απάντησε σε αυτό το email και ξεκινάμε.\n\nΦιλικά,\nCharaxis`
  )}`;
  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 text-[14px] ${q.status === "new" ? "border-ember/50 bg-ember/5" : "border-line"}`}>
      <div className="flex flex-wrap justify-between gap-2">
        <b>{q.customer_name}</b><span className="text-wood">{fmt(q.created_at)}</span>
      </div>
      <div className="flex flex-wrap gap-4 text-wood">
        <span>{q.customer_email}</span>
        {q.customer_phone && <a className="underline hover:text-ember" href={`tel:${q.customer_phone}`}>{q.customer_phone}</a>}
      </div>
      <p className="whitespace-pre-wrap break-words">{q.description}</p>
      {q.reference_image_url && <Photo path={q.reference_image_url} />}
      <div className="flex flex-wrap items-end gap-2">
        <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(QSTATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className={`${field} w-28`} placeholder="Τιμή €" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        <input className={`${field} min-w-0 flex-1`} placeholder="Σημειώσεις" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className={btn} onClick={() => save()}>Αποθήκευση</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a className={btnDark} href={mail} onClick={() => { if (status === "new") { setStatus("quoted"); save("quoted"); } }}>
          ✉️ Στείλε την προσφορά με email
        </a>
        {msg && <span className="text-wood">{msg}</span>}
      </div>
    </div>
  );
}

function Quotes({ rows, reload }: { rows: Quote[]; reload: () => void }) {
  if (rows.length === 0) return <p className="py-8 text-center font-serif text-wood">Κανένα αίτημα προσφοράς ακόμα.</p>;
  return <div className="flex flex-col gap-4">{rows.map((q) => <QuoteCard key={q.id} q={q} reload={reload} />)}</div>;
}

function Messages({ rows, reload }: { rows: Msg[]; reload: () => void }) {
  if (rows.length === 0) return <p className="py-8 text-center font-serif text-wood">Κανένα μήνυμα ακόμα.</p>;
  return (
    <div className="flex flex-col gap-4">
      {rows.map((m) => (
        <div key={m.id} className={`flex flex-col gap-2 rounded-xl border p-4 text-[14px] ${m.handled ? "border-line opacity-60" : "border-ember/50 bg-ember/5"}`}>
          <div className="flex flex-wrap justify-between gap-2"><b>{m.name}</b><span className="text-wood">{fmt(m.created_at)}</span></div>
          <p className="whitespace-pre-wrap break-words">{m.message}</p>
          <div className="flex flex-wrap gap-2">
            <a className={btnDark} href={`mailto:${m.email}?subject=${encodeURIComponent("Re: το μήνυμά σου στο Charaxis")}`}>Απάντηση ({m.email})</a>
            <button className={btn} onClick={async () => { await supabase.from("contact_messages").update({ handled: !m.handled }).eq("id", m.id); reload(); }}>
              {m.handled ? "Σήμανση ως νέο" : "✓ Απαντήθηκε"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Coupons() {
  const [rows, setRows] = useState<Coupon[] | null>(null);
  const [cc, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [max, setMax] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setRows((data as Coupon[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function create() {
    setErr(null);
    const { error } = await supabase.from("coupons").insert({
      code: cc.trim().toUpperCase(), discount_type: type, discount_value: Number(value.replace(",", ".")),
      max_uses: max.trim() === "" ? null : Number(max),
    });
    if (error) { setErr(error.message); return; }
    setCode(""); setValue(""); setMax(""); load();
  }
  return (
    <div className="flex flex-col gap-5 text-[14px]">
      <div className="flex flex-col gap-3 rounded-xl border border-line p-4">
        <b>Νέο κουπόνι</b>
        <div className="flex flex-wrap items-end gap-2">
          <input className={field} placeholder="ΚΩΔΙΚΟΣ (π.χ. XMAS10)" value={cc} onChange={(e) => setCode(e.target.value)} />
          <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="percentage">Ποσοστό %</option><option value="fixed">Σταθερό €</option>
          </select>
          <input className={`${field} w-24`} placeholder="Αξία" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
          <input className={`${field} w-32`} placeholder="Μέγ. χρήσεις" value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" />
          <button className={btnDark} onClick={create} disabled={!cc.trim() || !value.trim()}>Δημιουργία</button>
        </div>
        {err && <span className="text-ember-dark">{err}</span>}
      </div>
      {rows?.map((c) => (
        <div key={c.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 ${c.active ? "" : "opacity-50"}`}>
          <span><b className="tracking-wide">{c.code}</b> · {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} €`} · χρήσεις {c.times_used}{c.max_uses ? `/${c.max_uses}` : ""}</span>
          <button className={btn} onClick={async () => { await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id); load(); }}>
            {c.active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
          </button>
        </div>
      ))}
      {rows && rows.length === 0 && <p className="font-serif text-wood">Κανένα κουπόνι.</p>}
    </div>
  );
}

// Μικρό "ντινγκ" όταν έρχεται νέα παραγγελία (χωρίς αρχείο ήχου).
function ding() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {}
}

type Tab = "today" | "orders" | "products" | "quotes" | "messages" | "coupons" | "settings";

const ICONS: Record<Tab, string> = {
  today: "M3 12l9-8 9 8M5 10v10h14V10",
  orders: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  products: "M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7",
  quotes: "M4 5h16v11H8l-4 4z",
  messages: "M3 6h18v12H3zM3 7l9 6 9-6",
  coupons: "M4 8a2 2 0 002-2h12a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H6a2 2 0 00-2-2v-2a2 2 0 000-4zM10 9l4 6",
  settings: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
};

export default function AdminApp() {
  const [state, setState] = useState<"loading" | "out" | "denied" | "in">("loading");
  const [tab, setTab] = useState<Tab>("today");
  const [orderFilter, setOrderFilter] = useState("active");
  const [newProduct, setNewProduct] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const known = useRef<Set<string> | null>(null);
  const resetNewProduct = useCallback(() => setNewProduct(0), []);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setState("out"); return; }
    const { data: ok } = await supabase.rpc("is_admin");
    setState(ok === true ? "in" : "denied");
  }, []);
  useEffect(() => { check(); }, [check]);

  const loadAll = useCallback(async () => {
    const [o, q, m] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(300),
      supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const list = (o.data as Order[]) ?? [];
    // Νέα παραγγελία από την προηγούμενη φόρτωση → ήχος + μήνυμα.
    if (known.current) {
      const fresh = list.filter((x) => !known.current!.has(x.id) && stageOf(x) !== "abandoned");
      if (fresh.length) {
        ding();
        setToast(`🔔 Νέα παραγγελία: ${fresh[0].customer_name} (#${code(fresh[0].id)})`);
        setTimeout(() => setToast(null), 8000);
      }
    }
    known.current = new Set(list.map((x) => x.id));
    setOrders(list);
    setQuotes((q.data as Quote[]) ?? []);
    setMessages((m.data as Msg[]) ?? []);
  }, []);

  useEffect(() => {
    if (state !== "in") return;
    loadAll();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadAll();
    }, 60000);
    const onVis = () => document.visibilityState === "visible" && loadAll();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [state, loadAll]);

  const newQuotes = quotes.filter((q) => q.status === "new").length;
  const newMessages = messages.filter((m) => !m.handled).length;
  const todo = (orders ?? []).filter((o) => ["await_payment", "to_start", "engraving"].includes(stageOf(o))).length;

  // Ο αριθμός εκκρεμοτήτων φαίνεται και στην καρτέλα του browser.
  useEffect(() => {
    if (state !== "in") return;
    const n = todo + newQuotes + newMessages;
    document.title = `${n ? `(${n}) ` : ""}Διαχείριση — Charaxis`;
  }, [state, todo, newQuotes, newMessages]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) { setError("Λάθος email ή κωδικός."); return; }
    setPassword("");
    check();
  }
  async function logout() {
    await supabase.auth.signOut();
    setState("out");
  }

  function goto(t: "orders" | "quotes" | "messages" | "products", filter?: string) {
    if (t === "orders") setOrderFilter(filter ?? "active");
    if (t === "products") setNewProduct((n) => n + 1);
    setTab(t);
    window.scrollTo({ top: 0 });
  }

  if (state === "loading") return <main className="p-8 text-wood">Φόρτωση…</main>;

  if (state === "out" || state === "denied") {
    return (
      <main className="mx-auto flex max-w-sm flex-col gap-5 px-6 py-24">
        <div className="flex items-center gap-3">
          <Image src="/brand/charaxis-logo.jpg" alt="" width={48} height={48} className="h-12 w-12 rounded-full" />
          <h1 className="text-2xl font-semibold">Διαχείριση</h1>
        </div>
        {state === "denied" && (
          <p className="text-sm text-ember-dark">Αυτός ο λογαριασμός δεν έχει πρόσβαση διαχειριστή.{" "}
            <button className="underline" onClick={logout}>Αποσύνδεση</button></p>
        )}
        <form onSubmit={login} className="flex flex-col gap-3">
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <input className={field} type="password" placeholder="Κωδικός" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button className={`${btnDark} py-3`} type="submit">Σύνδεση</button>
          {error && <p className="text-sm text-ember-dark">{error}</p>}
        </form>
      </main>
    );
  }

  const tabs: { k: Tab; l: string; n?: number }[] = [
    { k: "today", l: "Σήμερα", n: todo },
    { k: "orders", l: "Παραγγελίες" },
    { k: "products", l: "Προϊόντα" },
    { k: "quotes", l: "Προσφορές", n: newQuotes },
    { k: "messages", l: "Μηνύματα", n: newMessages },
    { k: "coupons", l: "Κουπόνια" },
    { k: "settings", l: "Μεταφορικά" },
  ];
  const mobileTabs = tabs.filter((t) => ["today", "orders", "products", "quotes", "messages"].includes(t.k));

  const Icon = ({ t }: { t: Tab }) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={ICONS[t]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#F7F4EC] md:grid md:grid-cols-[230px_1fr]">
      {/* Πλαϊνό μενού (υπολογιστής) */}
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-line bg-paper p-5 md:flex print:hidden">
        <div className="flex flex-col gap-6">
          <a href="/" className="flex items-center gap-2.5" target="_blank" rel="noreferrer">
            <Image src="/brand/charaxis-logo.jpg" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
            <span className="flex flex-col leading-tight">
              <span className="font-bold">Charaxis</span>
              <span className="text-[11px] text-wood">Διαχείριση</span>
            </span>
          </a>
          <nav className="flex flex-col gap-1">
            {tabs.map((t) => (
              <button
                key={t.k}
                onClick={() => { if (t.k === "orders") setOrderFilter("active"); setTab(t.k); }}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${tab === t.k ? "bg-ink text-paper" : "hover:bg-line/50"}`}
              >
                <span className="flex items-center gap-3"><Icon t={t.k} />{t.l}</span>
                {!!t.n && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tab === t.k ? "bg-ember text-paper" : "bg-ember text-paper"}`}>{t.n}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 text-[13px]">
          <a className="text-wood hover:text-ink" href="/" target="_blank" rel="noreferrer">Δες το site ↗</a>
          <button className="text-left text-wood hover:text-ink" onClick={logout}>Αποσύνδεση</button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col gap-6 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
        {/* Κεφαλίδα κινητού */}
        <div className="flex items-center justify-between md:hidden print:hidden">
          <span className="flex items-center gap-2">
            <Image src="/brand/charaxis-logo.jpg" alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
            <b>{tabs.find((t) => t.k === tab)?.l}</b>
          </span>
          <div className="flex gap-2">
            <select className={`${field} py-1.5 text-[13px]`} value={tab} onChange={(e) => setTab(e.target.value as Tab)} aria-label="Ενότητα">
              {tabs.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
            </select>
          </div>
        </div>

        {toast && (
          <button onClick={() => { setToast(null); goto("orders", "active"); }} className="rounded-xl bg-ember px-4 py-3 text-left text-[14px] font-semibold text-paper shadow-lg">
            {toast} →
          </button>
        )}

        {!orders ? (
          <p className="text-wood">Φόρτωση…</p>
        ) : (
          <>
            {tab === "today" && <Today orders={orders} reload={loadAll} newQuotes={newQuotes} newMessages={newMessages} goto={goto} />}
            {tab === "orders" && <OrdersAdmin orders={orders} reload={loadAll} initialFilter={orderFilter} />}
            {tab === "products" && <ProductsAdmin startNew={newProduct} onConsumed={resetNewProduct} />}
            {tab === "quotes" && <Quotes rows={quotes} reload={loadAll} />}
            {tab === "messages" && <Messages rows={messages} reload={loadAll} />}
            {tab === "coupons" && <Coupons />}
            {tab === "settings" && <SettingsAdmin />}
          </>
        )}
      </main>

      {/* Κάτω μπάρα (κινητό) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-paper/95 backdrop-blur md:hidden print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {mobileTabs.map((t) => (
          <button
            key={t.k}
            onClick={() => { if (t.k === "orders") setOrderFilter("active"); setTab(t.k); window.scrollTo({ top: 0 }); }}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium ${tab === t.k ? "text-ember" : "text-ink/70"}`}
          >
            <Icon t={t.k} />
            {t.l}
            {!!t.n && <span className="absolute right-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-paper">{t.n}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
