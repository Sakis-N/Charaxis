"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { btn, btnDark, copy, field, fmt } from "@/components/admin/shared";

// Κοστολόγηση laser: ξύλο (αναλογικά με το εμβαδόν της πλάκας) + λεπτά laser × χρέωση + έξτρα.
// Όλες οι τιμές είναι χωρίς ΦΠΑ.

type Item = { id: string; kind: "sheet" | "extra"; name: string; width_cm: number | null; height_cm: number | null; price: number };
type SavedQuote = {
  id: string; created_at: string; customer: string; title: string; quantity: number; unit_price: number; total: number;
  details: Inputs & { lines?: Lines }; notes: string | null;
};
type Inputs = { sheetId: string; w: string; h: string; minutes: string; rate: string; extras: Record<string, string>; qty: string };
type Lines = { wood: number; laser: number; extras: number; unit: number };

const eur = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2).replace(".", ",")} €`;
const num = (s: string) => {
  const n = Number(String(s ?? "").trim().replace(",", "."));
  return isFinite(n) ? n : NaN;
};
// Λεπτά: δέχεται "6,5", "6.5" ή "6:30" (λεπτά:δευτερόλεπτα όπως το δείχνει το XCS).
function parseMinutes(s: string) {
  const t = (s ?? "").trim();
  const m = t.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) + Number(m[2]) / 60;
  return num(t);
}
const minLabel = (m: number) => {
  const whole = Math.floor(m);
  const sec = Math.round((m - whole) * 60);
  return sec ? `${whole}:${String(sec).padStart(2, "0")}` : `${whole}`;
};

const EMPTY: Inputs = { sheetId: "", w: "", h: "", minutes: "", rate: "", extras: {}, qty: "1" };

export default function CostingAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [rate, setRate] = useState("1");
  const [machine, setMachine] = useState("0.02");
  const [inp, setInp] = useState<Inputs>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState("");
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [i, s, q] = await Promise.all([
      supabase.from("cost_items").select("*").order("kind").order("name"),
      supabase.from("cost_settings").select("key,value"),
      supabase.from("cost_quotes").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const list = ((i.data ?? []) as Item[]).map((x) => ({ ...x, price: Number(x.price), width_cm: x.width_cm == null ? null : Number(x.width_cm), height_cm: x.height_cm == null ? null : Number(x.height_cm) }));
    setItems(list);
    setQuotes(((q.data ?? []) as SavedQuote[]));
    const settings = Object.fromEntries(((s.data ?? []) as { key: string; value: unknown }[]).map((x) => [x.key, x.value]));
    const r = typeof settings.laser_rate_per_min === "number" ? String(settings.laser_rate_per_min) : "1";
    setRate(r);
    if (typeof settings.machine_cost_per_min === "number") setMachine(String(settings.machine_cost_per_min));
    setInp((p) => ({
      ...p,
      rate: p.rate || r,
      sheetId: p.sheetId && list.some((x) => x.id === p.sheetId) ? p.sheetId : list.find((x) => x.kind === "sheet")?.id ?? "",
    }));
    setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const sheets = items.filter((x) => x.kind === "sheet");
  const extras = items.filter((x) => x.kind === "extra");
  const sheet = sheets.find((x) => x.id === inp.sheetId);

  const calc = useMemo(() => {
    const w = num(inp.w), h = num(inp.h), mins = parseMinutes(inp.minutes), r = num(inp.rate), qty = Math.max(1, Math.floor(num(inp.qty) || 1));
    const mc = num(machine) || 0;
    const sheetArea = sheet && sheet.width_cm && sheet.height_cm ? sheet.width_cm * sheet.height_cm : NaN;
    const share = w > 0 && h > 0 && sheetArea > 0 ? (w * h) / sheetArea : NaN;
    const wood = isFinite(share) && sheet ? share * sheet.price : 0;
    const laser = mins > 0 && r >= 0 ? mins * r : 0;
    const ex = extras.reduce((sum, e) => {
      const q = num(inp.extras[e.id] ?? "");
      return q > 0 ? sum + q * e.price : sum;
    }, 0);
    const unit = wood + laser + ex;
    const ownCost = wood + ex + (mins > 0 ? mins * mc : 0);
    return {
      ok: unit > 0, share, wood, laser, ex, unit, rounded: Math.ceil(unit * 2) / 2, ownCost, profit: unit - ownCost, qty, mins: mins > 0 ? mins : 0,
      tooBig: isFinite(share) && share > 1,
    };
  }, [inp, sheet, extras, machine]);

  const set = (patch: Partial<Inputs>) => setInp((p) => ({ ...p, ...patch }));

  function summaryText() {
    const name = title.trim() || "Χάραξη laser";
    const lines = [
      `${name}${inp.w && inp.h ? ` (${inp.w}×${inp.h} εκ.)` : ""}`,
      `Τιμή ανά τεμάχιο: ${eur(calc.unit)}`,
    ];
    if (calc.qty > 1) lines.push(`Ποσότητα: ${calc.qty} τεμ.`, `Σύνολο: ${eur(calc.unit * calc.qty)}`);
    lines.push("(Οι τιμές δεν περιλαμβάνουν ΦΠΑ)");
    return lines.join("\n");
  }

  async function saveQuote() {
    setMsg(null);
    if (!calc.ok) return;
    const { error } = await supabase.from("cost_quotes").insert({
      customer: customer.trim(), title: title.trim(), quantity: calc.qty,
      unit_price: Math.round(calc.unit * 100) / 100, total: Math.round(calc.unit * calc.qty * 100) / 100,
      details: { ...inp, sheetName: sheet?.name ?? null, lines: { wood: calc.wood, laser: calc.laser, extras: calc.ex, unit: calc.unit } },
    });
    if (error) { setMsg("Σφάλμα: " + error.message); return; }
    setMsg("✓ Η προσφορά αποθηκεύτηκε");
    setSaving(false); setCustomer(""); setTitle("");
    load();
  }

  if (!loaded) return <p className="text-wood">Φόρτωση…</p>;

  return (
    <div className="flex flex-col gap-8 text-[14px]">
      {/* ── Υπολογισμός ── */}
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
          <b className="text-[15px]">🧮 Υπολογισμός τιμής</b>
          {sheets.length === 0 ? (
            <p className="rounded-lg bg-ember/10 p-3 text-ember-dark">Πρόσθεσε πρώτα μια πλάκα στα «Υλικά» πιο κάτω (π.χ. Κόντρα πλακέ 3mm, 30×40, 1,50 €).</p>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-wood">Υλικό (πλάκα)</span>
              <select className={field} value={inp.sheetId} onChange={(e) => set({ sheetId: e.target.value })}>
                {sheets.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.width_cm}×{s.height_cm} εκ. · {eur(s.price)}</option>)}
              </select>
            </label>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-wood">Κομμάτι (εκ.)</span>
              <span className="flex items-center gap-1.5">
                <input className={`${field} w-20`} inputMode="decimal" placeholder="Πλάτος" value={inp.w} onChange={(e) => set({ w: e.target.value })} />
                ×
                <input className={`${field} w-20`} inputMode="decimal" placeholder="Ύψος" value={inp.h} onChange={(e) => set({ h: e.target.value })} />
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-wood">Λεπτά laser</span>
              <input className={`${field} w-24`} inputMode="decimal" placeholder="π.χ. 6:30" value={inp.minutes} onChange={(e) => set({ minutes: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-wood">€ / λεπτό</span>
              <input className={`${field} w-20`} inputMode="decimal" value={inp.rate} onChange={(e) => set({ rate: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-wood">Ποσότητα</span>
              <input className={`${field} w-20`} inputMode="numeric" value={inp.qty} onChange={(e) => set({ qty: e.target.value })} />
            </label>
          </div>
          {inp.rate !== rate && (
            <p className="text-[12.5px] text-wood">Χρέωση μόνο για αυτόν τον υπολογισμό. <button className="underline" onClick={() => set({ rate })}>Επαναφορά στο {rate.replace(".", ",")} €</button></p>
          )}

          {extras.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-wood">Έξτρα ανά κομμάτι</span>
              <div className="flex flex-wrap gap-2">
                {extras.map((e) => {
                  const v = inp.extras[e.id] ?? "";
                  const on = num(v) > 0;
                  return (
                    <span key={e.id} className={`flex items-center gap-2 rounded-full border px-3 py-1 ${on ? "border-ink bg-ink/5" : "border-line"}`}>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input type="checkbox" checked={on} onChange={(ev) => set({ extras: { ...inp.extras, [e.id]: ev.target.checked ? "1" : "" } })} />
                        {e.name} <span className="text-wood">{eur(e.price)}</span>
                      </label>
                      {on && (
                        <input className="w-10 rounded border border-line bg-paper px-1 text-center" inputMode="numeric" value={v} aria-label={`Πλήθος ${e.name}`}
                          onChange={(ev) => set({ extras: { ...inp.extras, [e.id]: ev.target.value } })} />
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <button className={`${btn} w-fit`} onClick={() => setInp({ ...EMPTY, rate, sheetId: inp.sheetId })}>Καθαρισμός</button>
        </div>

        {/* Αποτέλεσμα */}
        <div className="flex flex-col gap-3 self-start rounded-xl border border-ink bg-paper p-4">
          <b className="text-[15px]">Αποτέλεσμα <span className="font-normal text-wood">(χωρίς ΦΠΑ)</span></b>
          <Row l={`Ξύλο${isFinite(calc.share) ? ` (${(calc.share * 100).toFixed(1).replace(".", ",")}% της πλάκας)` : ""}`} v={calc.wood} />
          <Row l={`Laser${calc.mins ? ` (${minLabel(calc.mins)}′ × ${eur(num(inp.rate) || 0)})` : ""}`} v={calc.laser} />
          {calc.ex > 0 && <Row l="Έξτρα" v={calc.ex} />}
          {calc.tooBig && <p className="text-[12.5px] text-ember-dark">Το κομμάτι είναι μεγαλύτερο από την πλάκα.</p>}
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">Τιμή ανά τεμάχιο</span>
            <span className="text-[26px] font-bold">{eur(calc.unit)}</span>
          </div>
          {calc.ok && calc.rounded !== Math.round(calc.unit * 100) / 100 && (
            <p className="text-right text-wood">Στρογγυλεμένη: <b className="text-ink">{eur(calc.rounded)}</b></p>
          )}
          {calc.qty > 1 && (
            <div className="flex items-baseline justify-between rounded-lg bg-ink/5 px-3 py-2">
              <span>{calc.qty} τεμ. · laser ≈ {((calc.mins * calc.qty) / 60).toFixed(1).replace(".", ",")} ώρες</span>
              <b>{eur(calc.unit * calc.qty)}</b>
            </div>
          )}
          {calc.ok && (
            <p className="text-[12.5px] text-wood">
              Πραγματικό κόστος σου ≈ {eur(calc.ownCost)}/τεμ. (ξύλο, έξτρα, ρεύμα/φθορά) → μένουν ≈ <b className="text-ink">{eur(calc.profit)}</b>/τεμ. για τη δουλειά σου.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button className={btnDark} disabled={!calc.ok} onClick={() => { setSaving((s) => !s); setMsg(null); }}>💾 Αποθήκευση προσφοράς</button>
            <button className={btn} disabled={!calc.ok} onClick={async () => setMsg((await copy(summaryText())) ? "✓ Αντιγράφηκε — κάνε επικόλληση στο Viber/WhatsApp" : "Δεν έγινε αντιγραφή")}>📋 Αντιγραφή</button>
          </div>
          {saving && (
            <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
              <input className={field} placeholder="Πελάτης (π.χ. Σύλλογος Ιεροπηγής)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
              <input className={field} placeholder="Τι είναι (π.χ. Μετάλλιο με βάση)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className={btnDark} onClick={saveQuote}>Αποθήκευση</button>
            </div>
          )}
          {msg && <span className="text-wood">{msg}</span>}
        </div>
      </section>

      {/* ── Αποθηκευμένες προσφορές ── */}
      {quotes.length > 0 && (
        <section className="flex flex-col gap-3">
          <b className="text-[15px]">Αποθηκευμένες προσφορές</b>
          {quotes.map((q) => (
            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <b className="truncate">{q.customer || "—"}{q.title ? ` · ${q.title}` : ""}</b>
                <span className="text-wood">{fmt(q.created_at)} · {q.quantity} τεμ. × {eur(Number(q.unit_price))} = <b className="text-ink">{eur(Number(q.total))}</b></span>
              </span>
              <span className="flex gap-2">
                <button className={btn} onClick={() => {
                  const d = q.details || ({} as SavedQuote["details"]);
                  setInp({ sheetId: d.sheetId ?? inp.sheetId, w: d.w ?? "", h: d.h ?? "", minutes: d.minutes ?? "", rate: d.rate ?? rate, extras: d.extras ?? {}, qty: d.qty ?? String(q.quantity) });
                  setCustomer(q.customer); setTitle(q.title);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>Άνοιγμα</button>
                <button className={btn} onClick={async () => {
                  if (!confirm("Διαγραφή προσφοράς;")) return;
                  await supabase.from("cost_quotes").delete().eq("id", q.id);
                  load();
                }}>Διαγραφή</button>
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ── Ρυθμίσεις ── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <ItemsEditor kind="sheet" rows={sheets} reload={load} />
        <ItemsEditor kind="extra" rows={extras} reload={load} />
        <RateSettings rate={rate} machine={machine} reload={async () => { await load(); }} onRate={(r) => set({ rate: r })} />
      </section>
    </div>
  );
}

function Row({ l, v }: { l: string; v: number }) {
  return <div className="flex justify-between gap-3"><span className="text-wood">{l}</span><span>{eur(v)}</span></div>;
}

function ItemsEditor({ kind, rows, reload }: { kind: "sheet" | "extra"; rows: Item[]; reload: () => void }) {
  const isSheet = kind === "sheet";
  const [name, setName] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [price, setPrice] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);

  function startEdit(r: Item) {
    setEdit(r.id); setName(r.name); setW(r.width_cm?.toString() ?? ""); setH(r.height_cm?.toString() ?? ""); setPrice(String(r.price).replace(".", ","));
  }
  function reset() { setEdit(null); setName(""); setW(""); setH(""); setPrice(""); setErr(null); }

  async function save() {
    setErr(null);
    const p = num(price), ww = num(w), hh = num(h);
    if (!name.trim() || !(p >= 0) || price.trim() === "") { setErr("Συμπλήρωσε όνομα και τιμή."); return; }
    if (isSheet && !(ww > 0 && hh > 0)) { setErr("Συμπλήρωσε διαστάσεις πλάκας."); return; }
    const row = { kind, name: name.trim(), price: p, width_cm: isSheet ? ww : null, height_cm: isSheet ? hh : null };
    const { error } = edit ? await supabase.from("cost_items").update(row).eq("id", edit) : await supabase.from("cost_items").insert(row);
    if (error) { setErr(error.message); return; }
    reset(); reload();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
      <b>{isSheet ? "🪵 Υλικά (πλάκες)" : "🎀 Έξτρα ανά κομμάτι"}</b>
      <p className="text-[12.5px] text-wood">{isSheet ? "Τιμή ολόκληρης πλάκας. Το κόστος ξύλου βγαίνει αναλογικά με το εμβαδόν του κομματιού." : "Κρίκος, κορδέλα, κουτί, σακουλάκι, βερνίκι… με τιμή ανά τεμάχιο."}</p>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
          <span>{r.name}{isSheet && <span className="text-wood"> · {r.width_cm}×{r.height_cm} εκ.</span>} · <b>{eur(r.price)}</b></span>
          <span className="flex gap-1.5">
            <button className={btn} onClick={() => startEdit(r)}>Αλλαγή</button>
            <button className={btn} onClick={async () => {
              if (!confirm(`Διαγραφή «${r.name}»;`)) return;
              await supabase.from("cost_items").delete().eq("id", r.id);
              if (edit === r.id) reset();
              reload();
            }}>✕</button>
          </span>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2">
        <input className={`${field} min-w-0 flex-1`} placeholder={isSheet ? "π.χ. Κόντρα πλακέ 3mm" : "π.χ. Κρίκος"} value={name} onChange={(e) => setName(e.target.value)} />
        {isSheet && (
          <span className="flex items-center gap-1">
            <input className={`${field} w-16`} inputMode="decimal" placeholder="εκ." value={w} onChange={(e) => setW(e.target.value)} aria-label="Πλάτος πλάκας" />×
            <input className={`${field} w-16`} inputMode="decimal" placeholder="εκ." value={h} onChange={(e) => setH(e.target.value)} aria-label="Ύψος πλάκας" />
          </span>
        )}
        <input className={`${field} w-20`} inputMode="decimal" placeholder="€" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Τιμή" />
        <button className={btnDark} onClick={save}>{edit ? "Αποθήκευση" : "Προσθήκη"}</button>
        {edit && <button className={btn} onClick={reset}>Άκυρο</button>}
      </div>
      {err && <span className="text-ember-dark">{err}</span>}
    </div>
  );
}

function RateSettings({ rate, machine, reload, onRate }: { rate: string; machine: string; reload: () => Promise<void>; onRate: (r: string) => void }) {
  const [r, setR] = useState(rate.replace(".", ","));
  const [m, setM] = useState(machine.replace(".", ","));
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setR(rate.replace(".", ",")); }, [rate]);
  useEffect(() => { setM(machine.replace(".", ",")); }, [machine]);

  async function save() {
    setMsg(null);
    const rv = num(r), mv = num(m);
    if (!(rv >= 0) || !(mv >= 0) || r.trim() === "" || m.trim() === "") { setMsg("Βάλε έγκυρα ποσά."); return; }
    const now = new Date().toISOString();
    const { error } = await supabase.from("cost_settings").upsert([
      { key: "laser_rate_per_min", value: rv, updated_at: now },
      { key: "machine_cost_per_min", value: mv, updated_at: now },
    ]);
    if (error) { setMsg(error.message); return; }
    onRate(String(rv));
    await reload();
    setMsg("Αποθηκεύτηκε ✓");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
      <b>⚙️ Χρέωση laser</b>
      <label className="flex flex-wrap items-center justify-between gap-2">
        <span>Χρέωση ανά λεπτό <span className="text-wood">(αυτό που πληρώνει ο πελάτης)</span></span>
        <span className="flex items-center gap-1"><input className={`${field} w-20`} inputMode="decimal" value={r} onChange={(e) => setR(e.target.value)} /> €</span>
      </label>
      <label className="flex flex-wrap items-center justify-between gap-2">
        <span>Πραγματικό κόστος μηχανής ανά λεπτό <span className="text-wood">(ρεύμα, φθορά, συντήρηση)</span></span>
        <span className="flex items-center gap-1"><input className={`${field} w-20`} inputMode="decimal" value={m} onChange={(e) => setM(e.target.value)} /> €</span>
      </label>
      <p className="text-[12.5px] text-wood">
        {num(r) >= 0 ? `${eur(num(r) * 60)} την ώρα laser. ` : ""}Το πραγματικό κόστος χρησιμοποιείται μόνο για να σου δείχνει πόσα σου μένουν.
      </p>
      <button className={`${btn} w-fit`} onClick={save}>Αποθήκευση</button>
      {msg && <span className="text-wood">{msg}</span>}
    </div>
  );
}
