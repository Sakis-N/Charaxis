"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import SettingsAdmin from "@/components/admin/SettingsAdmin";

type Design = { fields?: { id: string; label: string; value: string }[]; photos?: { field: string; path: string }[] } | null;
type OrderItem = { id: string; product_name_snapshot: string; quantity: number; line_total: number; custom_design: Design };
type Order = {
  id: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string | null;
  shipping_address: { address?: string; city?: string; postcode?: string; pickup_point?: string | null };
  shipping_method: string; shipping_cost: number; discount_amount: number; total: number;
  status: string; payment_provider: string; payment_status: string; notes: string | null;
  tracking_number: string | null; admin_notes: string | null; order_items: OrderItem[];
};
type Quote = {
  id: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string | null;
  description: string; reference_image_url: string | null; status: string; quoted_price: number | null; admin_notes: string | null;
};
type Msg = { id: string; created_at: string; name: string; email: string; message: string; handled: boolean };
type Coupon = { id: string; code: string; discount_type: string; discount_value: number; max_uses: number | null; times_used: number; expires_at: string | null; active: boolean };

const STATUSES: Record<string, string> = {
  pending: "Σε αναμονή", paid: "Πληρώθηκε", processing: "Σε παραγωγή",
  shipped: "Στάλθηκε", completed: "Ολοκληρώθηκε", cancelled: "Ακυρώθηκε",
};
const METHOD: Record<string, string> = { acs: "ACS", boxnow: "BoxNow", skroutz: "Skroutz" };
const QSTATUS: Record<string, string> = { new: "Νέο", quoted: "Στάλθηκε προσφορά", accepted: "Έγινε δεκτό", declined: "Απορρίφθηκε", completed: "Ολοκληρώθηκε" };

const btn = "border border-ink px-3 py-1.5 text-sm transition-colors hover:border-ember hover:text-ember disabled:opacity-40";
const field = "border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink";
const fmt = (d: string) => new Date(d).toLocaleString("el-GR", { dateStyle: "short", timeStyle: "short" });
const money = (n: number) => `${Number(n).toFixed(2)} €`;

async function callNotify(orderId: string, kind: "paid" | "shipped") {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const r = await fetch("/api/admin/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ order_id: orderId, kind }),
  });
  return r.ok;
}

function Photo({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [dl, setDl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("customer-uploads").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
    supabase.storage.from("customer-uploads").createSignedUrl(path, 3600, { download: true }).then(({ data }) => setDl(data?.signedUrl ?? null));
  }, [path]);
  if (!url) return <div className="h-24 w-24 border border-line" />;
  return (
    <div className="flex flex-col gap-1">
      <a href={url} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Φωτογραφία πελάτη" className="h-24 w-24 border border-line object-cover" />
      </a>
      {dl && <a href={dl} className="text-xs underline hover:text-ember">Λήψη</a>}
    </div>
  );
}

function OrderCard({ o, reload }: { o: Order; reload: () => void }) {
  const [open, setOpen] = useState(o.status === "pending");
  const [tracking, setTracking] = useState(o.tracking_number ?? "");
  const [notes, setNotes] = useState(o.admin_notes ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const a = o.shipping_address || {};

  async function update(patch: Record<string, unknown>, notify?: "paid" | "shipped") {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.from("orders").update(patch).eq("id", o.id);
    if (error) { setMsg("Σφάλμα: " + error.message); setBusy(false); return; }
    let note = "Αποθηκεύτηκε ✓";
    if (notify) note += (await callNotify(o.id, notify)) ? " · email στάλθηκε στον πελάτη" : " · (email δεν στάλθηκε — έλεγξε τη ρύθμιση email)";
    setMsg(note);
    setBusy(false);
    reload();
  }

  const unpaidBank = o.payment_provider === "bank_transfer" && o.payment_status !== "paid";

  return (
    <div className="border border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left text-sm">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <b className="font-semibold">#{o.id.slice(0, 8).toUpperCase()}</b>
          <span>{o.customer_name}</span>
          <span className="text-wood">{fmt(o.created_at)}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className={o.payment_status === "paid" ? "text-green-700" : "text-ember-dark"}>
            {o.payment_status === "paid" ? "Πληρωμένη" : o.payment_provider === "stripe" ? "Αναμονή κάρτας" : "Αναμονή κατάθεσης"}
          </span>
          <span className="border border-line px-2 py-0.5">{STATUSES[o.status] ?? o.status}</span>
          <b>{money(o.total)}</b>
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-line px-4 py-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <b>Πελάτης</b>
              <span>{o.customer_name}</span>
              <a className="underline hover:text-ember" href={`mailto:${o.customer_email}`}>{o.customer_email}</a>
              {o.customer_phone && <a className="underline hover:text-ember" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a>}
            </div>
            <div className="flex flex-col gap-1">
              <b>{METHOD[o.shipping_method] ?? o.shipping_method} ({money(o.shipping_cost)})</b>
              <span>{a.address}</span>
              <span>{a.city} {a.postcode}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {o.order_items.map((i) => (
              <div key={i.id} className="flex flex-col gap-2 border-t border-line pt-3">
                <div className="flex justify-between"><b>{i.quantity} × {i.product_name_snapshot}</b><span>{money(i.line_total)}</span></div>
                {i.custom_design?.fields?.map((f) => (
                  <div key={f.id} className="whitespace-pre-wrap break-words text-wood"><span className="text-faint">{f.label}:</span> <span className="text-ink">{f.value}</span></div>
                ))}
                {(i.custom_design?.photos?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-3">{i.custom_design!.photos!.map((p) => <Photo key={p.path} path={p.path} />)}</div>
                )}
              </div>
            ))}
          </div>
          {o.notes && <div><b>Σημείωση πελάτη:</b> {o.notes}</div>}

          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
            <label className="flex flex-col gap-1">
              <span className="text-wood">Κατάσταση</span>
              <select className={field} value={o.status} onChange={(e) => update({ status: e.target.value })} disabled={busy}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-wood">Tracking</span>
              <input className={field} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Αρ. αποστολής" />
            </label>
            <button className={btn} disabled={busy} onClick={() => update({ status: "shipped", tracking_number: tracking.trim() || null }, "shipped")}>
              Στάλθηκε + email πελάτη
            </button>
            {unpaidBank && (
              <button className={btn} disabled={busy} onClick={() => update({ payment_status: "paid", status: o.status === "pending" ? "paid" : o.status }, "paid")}>
                Η κατάθεση ήρθε ✓ (+email)
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <textarea className={field} rows={2} placeholder="Εσωτερικές σημειώσεις (δεν τις βλέπει ο πελάτης)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex items-center gap-3">
              <button className={btn} disabled={busy} onClick={() => update({ admin_notes: notes, tracking_number: tracking.trim() || null })}>Αποθήκευση</button>
              <button className={btn} onClick={() => window.print()}>Εκτύπωση</button>
              {msg && <span className="text-wood">{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState("active");
  const load = useCallback(async () => {
    const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
    setRows((data as Order[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <p className="text-wood">Φόρτωση…</p>;
  const shown = rows.filter((o) =>
    filter === "all" ? true : filter === "active" ? !["completed", "cancelled"].includes(o.status) : o.status === filter);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm">
        <select className={field} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="active">Ενεργές</option>
          <option value="all">Όλες</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className={btn} onClick={load}>Ανανέωση</button>
        <span className="text-wood">{shown.length} παραγγελίες</span>
      </div>
      {shown.length === 0 && <p className="font-serif text-wood">Καμία παραγγελία ακόμα.</p>}
      {shown.map((o) => <OrderCard key={o.id} o={o} reload={load} />)}
    </div>
  );
}

function QuoteCard({ q, reload }: { q: Quote; reload: () => void }) {
  const [price, setPrice] = useState(q.quoted_price?.toString() ?? "");
  const [notes, setNotes] = useState(q.admin_notes ?? "");
  const [status, setStatus] = useState(q.status);
  const [msg, setMsg] = useState<string | null>(null);
  async function save() {
    const { error } = await supabase.from("quote_requests").update({
      status, admin_notes: notes, quoted_price: price.trim() === "" ? null : Number(price.replace(",", ".")),
    }).eq("id", q.id);
    setMsg(error ? error.message : "Αποθηκεύτηκε ✓");
    reload();
  }
  return (
    <div className="flex flex-col gap-3 border border-line p-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <b>{q.customer_name}</b><span className="text-wood">{fmt(q.created_at)}</span>
      </div>
      <div className="flex flex-wrap gap-4">
        <a className="underline hover:text-ember" href={`mailto:${q.customer_email}?subject=${encodeURIComponent("Προσφορά Charaxis")}`}>{q.customer_email}</a>
        {q.customer_phone && <a className="underline hover:text-ember" href={`tel:${q.customer_phone}`}>{q.customer_phone}</a>}
      </div>
      <p className="whitespace-pre-wrap break-words">{q.description}</p>
      {q.reference_image_url && <Photo path={q.reference_image_url} />}
      <div className="flex flex-wrap items-end gap-3">
        <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(QSTATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className={`${field} w-28`} placeholder="Τιμή €" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        <input className={`${field} min-w-0 flex-1`} placeholder="Σημειώσεις" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className={btn} onClick={save}>Αποθήκευση</button>
        {msg && <span className="text-wood">{msg}</span>}
      </div>
    </div>
  );
}

function Quotes() {
  const [rows, setRows] = useState<Quote[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as Quote[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <p className="text-wood">Φόρτωση…</p>;
  if (rows.length === 0) return <p className="font-serif text-wood">Κανένα αίτημα προσφοράς ακόμα.</p>;
  return <div className="flex flex-col gap-4">{rows.map((q) => <QuoteCard key={q.id} q={q} reload={load} />)}</div>;
}

function Messages() {
  const [rows, setRows] = useState<Msg[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as Msg[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <p className="text-wood">Φόρτωση…</p>;
  if (rows.length === 0) return <p className="font-serif text-wood">Κανένα μήνυμα ακόμα.</p>;
  return (
    <div className="flex flex-col gap-4">
      {rows.map((m) => (
        <div key={m.id} className={`flex flex-col gap-2 border p-4 text-sm ${m.handled ? "border-line opacity-60" : "border-ink"}`}>
          <div className="flex flex-wrap justify-between gap-2"><b>{m.name}</b><span className="text-wood">{fmt(m.created_at)}</span></div>
          <a className="w-fit underline hover:text-ember" href={`mailto:${m.email}`}>{m.email}</a>
          <p className="whitespace-pre-wrap break-words">{m.message}</p>
          <button className={`${btn} w-fit`} onClick={async () => { await supabase.from("contact_messages").update({ handled: !m.handled }).eq("id", m.id); load(); }}>
            {m.handled ? "Σήμανση ως νέο" : "Σήμανση ως απαντημένο"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Coupons() {
  const [rows, setRows] = useState<Coupon[] | null>(null);
  const [code, setCode] = useState("");
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
      code: code.trim().toUpperCase(), discount_type: type, discount_value: Number(value.replace(",", ".")),
      max_uses: max.trim() === "" ? null : Number(max),
    });
    if (error) { setErr(error.message); return; }
    setCode(""); setValue(""); setMax(""); load();
  }
  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="flex flex-wrap items-end gap-3">
        <input className={field} placeholder="ΚΩΔΙΚΟΣ" value={code} onChange={(e) => setCode(e.target.value)} />
        <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="percentage">Ποσοστό %</option><option value="fixed">Σταθερό €</option>
        </select>
        <input className={`${field} w-24`} placeholder="Αξία" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
        <input className={`${field} w-28`} placeholder="Μέγ. χρήσεις" value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" />
        <button className={btn} onClick={create} disabled={!code.trim() || !value.trim()}>Δημιουργία</button>
        {err && <span className="text-ember-dark">{err}</span>}
      </div>
      {rows?.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3">
          <span><b>{c.code}</b> · {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} €`} · χρήσεις {c.times_used}{c.max_uses ? `/${c.max_uses}` : ""}</span>
          <button className={btn} onClick={async () => { await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id); load(); }}>
            {c.active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
          </button>
        </div>
      ))}
      {rows && rows.length === 0 && <p className="font-serif text-wood">Κανένα κουπόνι.</p>}
    </div>
  );
}

export default function AdminApp() {
  const [state, setState] = useState<"loading" | "out" | "denied" | "in">("loading");
  const [tab, setTab] = useState<"orders" | "products" | "quotes" | "messages" | "coupons" | "settings">("orders");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setState("out"); return; }
    const { data: ok } = await supabase.rpc("is_admin");
    setState(ok === true ? "in" : "denied");
  }, []);
  useEffect(() => { check(); }, [check]);

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

  if (state === "loading") return <main className="p-8 text-wood">Φόρτωση…</main>;

  if (state === "out" || state === "denied") {
    return (
      <main className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-24">
        <h1 className="text-2xl font-medium">Διαχείριση Charaxis</h1>
        {state === "denied" && (
          <p className="text-sm text-ember-dark">Αυτός ο λογαριασμός δεν έχει πρόσβαση διαχειριστή.{" "}
            <button className="underline" onClick={logout}>Αποσύνδεση</button></p>
        )}
        <form onSubmit={login} className="flex flex-col gap-3">
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <input className={field} type="password" placeholder="Κωδικός" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button className="bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-ember" type="submit">Σύνδεση</button>
          {error && <p className="text-sm text-ember-dark">{error}</p>}
        </form>
      </main>
    );
  }

  const tabs = [["orders", "Παραγγελίες"], ["products", "Προϊόντα"], ["quotes", "Προσφορές"], ["messages", "Μηνύματα"], ["coupons", "Κουπόνια"], ["settings", "Μεταφορικά"]] as const;
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-medium">Διαχείριση Charaxis</h1>
        <button className={btn} onClick={logout}>Αποσύνδεση</button>
      </header>
      <nav className="flex flex-wrap gap-2 border-b border-line pb-3 print:hidden">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm ${tab === k ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}>{l}</button>
        ))}
      </nav>
      {tab === "orders" && <Orders />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "quotes" && <Quotes />}
      {tab === "settings" && <SettingsAdmin />}
      {tab === "messages" && <Messages />}
      {tab === "coupons" && <Coupons />}
    </main>
  );
}
