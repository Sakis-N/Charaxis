"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type CF = {
  id: string;
  type: "text" | "textarea" | "photo" | "logo" | "select" | "toggle_text";
  label: string;
  description?: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  toggle_yes?: string;
  toggle_no?: string;
};
type Product = {
  id?: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string;
  material: string;
  dimensions: string;
  base_price: string;
  is_customizable: boolean;
  active: boolean;
  sort_order: number;
  images: string[];
  custom_fields: CF[];
};
type Category = { id: string; name: string; slug: string; description: string | null; sort_order: number; active: boolean; parent_id: string | null };
// Εμφάνιση "Κύρια › Υπο" για επιλογές και λίστες.
const catLabel = (cats: Category[], c: Category): string => {
  const parent = c.parent_id ? cats.find((x) => x.id === c.parent_id) : null;
  return parent ? `${parent.name} › ${c.name}` : c.name;
};
// Σειρά: κάθε κύρια ακολουθείται από τις υποκατηγορίες της.
const catTree = (cats: Category[]): Category[] =>
  cats.filter((c) => !c.parent_id).flatMap((c) => [c, ...cats.filter((x) => x.parent_id === c.id)]);

const btn = "border border-ink px-3 py-1.5 text-sm transition-colors hover:border-ember hover:text-ember disabled:opacity-40";
const field = "w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink";
const TYPES: Record<CF["type"], string> = {
  text: "Μικρό κείμενο",
  textarea: "Μεγάλο κείμενο",
  photo: "Φωτογραφία πελάτη",
  logo: "Λογότυπο / αρχείο σχεδίου (SVG, PDF, PNG…)",
  select: "Επιλογή (κουμπιά)",
  toggle_text: "Ναι/Όχι + κείμενο",
};

const GR: Record<string, string> = {
  α: "a", ά: "a", β: "v", γ: "g", δ: "d", ε: "e", έ: "e", ζ: "z", η: "i", ή: "i", θ: "th", ι: "i", ί: "i", ϊ: "i", ΐ: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", ό: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", ύ: "y", ϋ: "y",
  ΰ: "y", φ: "f", χ: "x", ψ: "ps", ω: "o", ώ: "o",
};
const slugify = (s: string) =>
  s.toLowerCase().split("").map((c) => GR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const empty = (): Product => ({
  name: "", slug: "", category_id: null, description: "", material: "Ξύλο", dimensions: "", base_price: "",
  is_customizable: true, active: true, sort_order: 0, images: [], custom_fields: [],
});

// Σμίκρυνση φωτογραφίας πριν το ανέβασμα (γρήγορο site, μικρό storage).
async function resize(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("resize"))), "image/jpeg", 0.86));
}

function Editor({ initial, cats, onDone }: { initial: Product; cats: Category[]; onDone: () => void }) {
  const [p, setP] = useState<Product>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = !initial.id;
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));

  async function upload(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setMsg(null);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      try {
        const blob = await resize(f);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
      } catch (e) {
        setMsg("Αποτυχία ανεβάσματος φωτογραφίας: " + (e instanceof Error ? e.message : ""));
      }
    }
    setP((x) => ({ ...x, images: [...x.images, ...urls] }));
    setBusy(false);
  }

  const move = (arr: unknown[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return arr;
    const a = [...arr];
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  };
  const setCF = (i: number, patch: Partial<CF>) =>
    set("custom_fields", p.custom_fields.map((f, k) => (k === i ? { ...f, ...patch } : f)));

  async function save() {
    setMsg(null);
    if (!p.name.trim()) { setMsg("Βάλε όνομα."); return; }
    const price = Number(p.base_price.replace(",", "."));
    if (!isFinite(price) || price < 0 || p.base_price.trim() === "") { setMsg("Βάλε έγκυρη τιμή."); return; }
    const slug = p.slug.trim() || slugify(p.name);
    // Μοναδικά ids πεδίων (από την ετικέτα).
    const used = new Set<string>();
    const cf = p.custom_fields.map((f, i) => {
      let id = f.id?.trim() || slugify(f.label) || `field${i + 1}`;
      while (used.has(id)) id += "_";
      used.add(id);
      const out: CF = { ...f, id };
      if (f.type !== "select") delete out.options;
      if (f.type !== "toggle_text") { delete out.toggle_yes; delete out.toggle_no; delete out.hint; }
      return out;
    });
    const row = {
      name: p.name.trim(), slug, category_id: p.category_id || null, description: p.description.trim() || null,
      material: p.material.trim() || "Ξύλο", dimensions: p.dimensions.trim() || null, base_price: price,
      is_customizable: p.is_customizable, active: p.active, sort_order: Number(p.sort_order) || 0,
      images: p.images, custom_fields: p.is_customizable ? cf : [],
    };
    setBusy(true);
    const { error } = isNew
      ? await supabase.from("products").insert(row)
      : await supabase.from("products").update({ ...row, updated_at: new Date().toISOString() }).eq("id", p.id!);
    setBusy(false);
    if (error) { setMsg(error.code === "23505" ? "Υπάρχει ήδη προϊόν με αυτό το slug (διεύθυνση)." : error.message); return; }
    onDone();
  }

  async function remove() {
    if (!p.id) return;
    if (!window.confirm("Σίγουρα θες να διαγράψεις αυτό το προϊόν;")) return;
    setBusy(true);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setBusy(false);
    if (error) { setMsg("Δεν μπορεί να διαγραφεί (έχει παραγγελίες). Κάν' το «Ανενεργό» για να κρυφτεί από το κατάστημα."); return; }
    onDone();
  }

  return (
    <div className="flex flex-col gap-5 border border-ink p-4 text-sm">
      <div className="flex items-center justify-between">
        <b className="text-base">{isNew ? "Νέο προϊόν" : "Επεξεργασία προϊόντος"}</b>
        <button className={btn} onClick={onDone}>Κλείσιμο</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="text-wood">Όνομα</span>
          <input className={field} value={p.name} onChange={(e) => { set("name", e.target.value); if (isNew) set("slug", slugify(e.target.value)); }} /></label>
        <label className="flex flex-col gap-1"><span className="text-wood">Τιμή (€)</span>
          <input className={field} inputMode="decimal" value={p.base_price} onChange={(e) => set("base_price", e.target.value)} /></label>
        <label className="flex flex-col gap-1"><span className="text-wood">Κατηγορία</span>
          <select className={field} value={p.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
            <option value="">— καμία —</option>
            {catTree(cats).map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "\u00a0\u00a0↳ " : ""}{catLabel(cats, c)}</option>)}
          </select></label>
        <label className="flex flex-col gap-1"><span className="text-wood">Διεύθυνση σελίδας (slug)</span>
          <input className={field} value={p.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></label>
        <label className="flex flex-col gap-1"><span className="text-wood">Υλικό</span>
          <input className={field} value={p.material} onChange={(e) => set("material", e.target.value)} /></label>
        <label className="flex flex-col gap-1"><span className="text-wood">Διαστάσεις (π.χ. 15 x 13 εκ.)</span>
          <input className={field} value={p.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></label>
      </div>
      <label className="flex flex-col gap-1"><span className="text-wood">Περιγραφή</span>
        <textarea className={field} rows={4} value={p.description} onChange={(e) => set("description", e.target.value)} /></label>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.active} onChange={(e) => set("active", e.target.checked)} /> Ενεργό (φαίνεται στο κατάστημα)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_customizable} onChange={(e) => set("is_customizable", e.target.checked)} /> Προσωποποιείται από τον πελάτη</label>
        <label className="flex items-center gap-2">Σειρά <input className={`${field} w-20`} type="number" value={p.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></label>
      </div>

      <div className="flex flex-col gap-2">
        <b>Φωτογραφίες (η πρώτη είναι η κύρια · 2–5 προτείνονται)</b>
        <div className="flex flex-wrap gap-3">
          {p.images.map((u, i) => (
            <div key={u} className="flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-24 w-24 border border-line object-cover" />
              <div className="flex justify-between text-xs">
                <button onClick={() => set("images", move(p.images, i, -1) as string[])}>←</button>
                <button onClick={() => set("images", p.images.filter((_, k) => k !== i))} className="text-ember-dark">Αφαίρεση</button>
                <button onClick={() => set("images", move(p.images, i, 1) as string[])}>→</button>
              </div>
            </div>
          ))}
        </div>
        <label className={`${btn} w-fit cursor-pointer`}>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          {busy ? "Περίμενε…" : "+ Ανέβασμα φωτογραφιών"}
        </label>
      </div>

      {p.is_customizable && (
        <div className="flex flex-col gap-3">
          <b>Πεδία προσαρμογής (τι συμπληρώνει ο πελάτης)</b>
          {p.custom_fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 border border-line p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-wood">{i + 1}.</span>
                <select className={`${field} w-auto`} value={f.type} onChange={(e) => setCF(i, { type: e.target.value as CF["type"] })}>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className={`${field} min-w-0 flex-1`} placeholder="Ερώτηση προς τον πελάτη (π.χ. Όνομα)" value={f.label} onChange={(e) => setCF(i, { label: e.target.value })} />
                <button className="px-2" onClick={() => set("custom_fields", move(p.custom_fields, i, -1) as CF[])}>↑</button>
                <button className="px-2" onClick={() => set("custom_fields", move(p.custom_fields, i, 1) as CF[])}>↓</button>
                <button className="px-2 text-ember-dark" onClick={() => set("custom_fields", p.custom_fields.filter((_, k) => k !== i))}>✕</button>
              </div>
              <input className={field} placeholder="Επεξήγηση (προαιρετικό)" value={f.description ?? ""} onChange={(e) => setCF(i, { description: e.target.value })} />
              {(f.type === "text" || f.type === "textarea" || f.type === "toggle_text") && (
                <input className={field} placeholder="Placeholder μέσα στο πεδίο (προαιρετικό)" value={f.placeholder ?? ""} onChange={(e) => setCF(i, { placeholder: e.target.value })} />
              )}
              {f.type === "select" && (
                <textarea className={field} rows={2} placeholder="Επιλογές, μία ανά γραμμή" value={(f.options ?? []).join("\n")}
                  onChange={(e) => setCF(i, { options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
              )}
              {f.type === "toggle_text" && (
                <div className="grid gap-2 md:grid-cols-3">
                  <input className={field} placeholder="Κουμπί «Ναι» (π.χ. Ναι, θέλω QR)" value={f.toggle_yes ?? ""} onChange={(e) => setCF(i, { toggle_yes: e.target.value })} />
                  <input className={field} placeholder="Κουμπί «Όχι»" value={f.toggle_no ?? ""} onChange={(e) => setCF(i, { toggle_no: e.target.value })} />
                  <input className={field} placeholder="Υπόδειξη κάτω από το πεδίο" value={f.hint ?? ""} onChange={(e) => setCF(i, { hint: e.target.value })} />
                </div>
              )}
            </div>
          ))}
          <button className={`${btn} w-fit`} onClick={() => set("custom_fields", [...p.custom_fields, { id: "", type: "text", label: "" }])}>+ Προσθήκη πεδίου</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button className="bg-ink px-5 py-2 text-paper hover:bg-ember disabled:opacity-40" disabled={busy} onClick={save}>Αποθήκευση</button>
        {!isNew && <button className={btn} disabled={busy} onClick={remove}>Διαγραφή</button>}
        {msg && <span className="text-ember-dark">{msg}</span>}
      </div>
    </div>
  );
}

function Categories({ cats, reload }: { cats: Category[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [err, setErr] = useState<string | null>(null);
  async function add() {
    setErr(null);
    const { error } = await supabase.from("categories").insert({
      name: name.trim(), slug: slugify(name), sort_order: cats.length + 1, parent_id: parent || null,
    });
    if (error) { setErr(error.code === "23505" ? "Υπάρχει ήδη κατηγορία με αυτό το όνομα." : error.message); return; }
    setName(""); setParent(""); reload();
  }
  async function setParentOf(c: Category, pid: string) {
    setErr(null);
    const { error } = await supabase.from("categories").update({ parent_id: pid || null }).eq("id", c.id);
    if (error) { setErr(error.message); return; }
    reload();
  }
  const tops = cats.filter((c) => !c.parent_id);
  return (
    <div className="flex flex-col gap-3 border border-line p-4 text-sm">
      <b>Κατηγορίες &amp; υποκατηγορίες</b>
      {catTree(cats).map((c) => {
        const hasChildren = cats.some((x) => x.parent_id === c.id);
        return (
          <div key={c.id} className={`flex flex-wrap items-center justify-between gap-2 ${c.parent_id ? "pl-6" : ""}`}>
            <span>{c.parent_id ? "↳ " : ""}{c.name} <span className="text-faint">/kategories/{c.slug}</span></span>
            <span className="flex flex-wrap items-center gap-2">
              <select
                className="border border-line bg-paper px-2 py-1.5 text-xs"
                value={c.parent_id ?? ""}
                disabled={hasChildren}
                title={hasChildren ? "Έχει υποκατηγορίες, δεν μπορεί να γίνει υποκατηγορία" : "Ανήκει σε"}
                onChange={(e) => setParentOf(c, e.target.value)}
              >
                <option value="">Κύρια κατηγορία</option>
                {tops.filter((t) => t.id !== c.id).map((t) => <option key={t.id} value={t.id}>Υπό: {t.name}</option>)}
              </select>
              <button className={btn} onClick={async () => { await supabase.from("categories").update({ active: !c.active }).eq("id", c.id); reload(); }}>
                {c.active ? "Απόκρυψη" : "Εμφάνιση"}
              </button>
            </span>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <input className={`${field} min-w-[180px] flex-1`} placeholder="Νέα κατηγορία" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={`${field} w-auto`} value={parent} onChange={(e) => setParent(e.target.value)}>
          <option value="">Κύρια κατηγορία</option>
          {tops.map((t) => <option key={t.id} value={t.id}>Υποκατηγορία του: {t.name}</option>)}
        </select>
        <button className={btn} disabled={!name.trim()} onClick={add}>Προσθήκη</button>
      </div>
      {err && <span className="text-ember-dark">{err}</span>}
    </div>
  );
}

export default function ProductsAdmin() {
  const [rows, setRows] = useState<(Product & { id: string })[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const [{ data: pr }, { data: ct }] = await Promise.all([
      supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setRows(((pr ?? []) as Record<string, unknown>[]).map((r) => ({
      ...(r as unknown as Product & { id: string }),
      description: (r.description as string) ?? "",
      dimensions: (r.dimensions as string) ?? "",
      base_price: r.base_price != null ? String(r.base_price) : "",
      images: (r.images as string[]) ?? [],
      custom_fields: (r.custom_fields as CF[]) ?? [],
    })));
    setCats((ct ?? []) as Category[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (editing) return <Editor initial={editing} cats={cats} onDone={() => { setEditing(null); load(); }} />;
  if (!rows) return <p className="text-wood">Φόρτωση…</p>;

  return (
    <div className="flex flex-col gap-5">
      <div><button className="bg-ink px-5 py-2 text-sm text-paper hover:bg-ember" onClick={() => setEditing(empty())}>+ Νέο προϊόν</button></div>
      <div className="flex flex-col divide-y divide-line border-y border-line text-sm">
        {rows.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.images[0] ? <img src={p.images[0]} alt="" className="h-12 w-12 border border-line object-cover" /> : <div className="h-12 w-12 border border-line" />}
            <div className="min-w-0 flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-wood">{Number(p.base_price).toFixed(2)} € · {(() => { const c = cats.find((x) => x.id === p.category_id); return c ? catLabel(cats, c) : "χωρίς κατηγορία"; })()}</div>
            </div>
            <span className={p.active ? "text-green-700" : "text-faint"}>{p.active ? "Ενεργό" : "Ανενεργό"}</span>
            <button className={btn} onClick={async () => { await supabase.from("products").update({ active: !p.active }).eq("id", p.id); load(); }}>
              {p.active ? "Απόκρυψη" : "Εμφάνιση"}
            </button>
            <button className={btn} onClick={() => setEditing(p)}>Επεξεργασία</button>
          </div>
        ))}
        {rows.length === 0 && <p className="py-4 font-serif text-wood">Κανένα προϊόν ακόμα.</p>}
      </div>
      <Categories cats={cats} reload={load} />
    </div>
  );
}
