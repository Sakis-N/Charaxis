"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SM = { code: string; label: string; cost: number; remote_cost: number | null; active: boolean };

const btn = "border border-ink px-3 py-1.5 text-sm transition-colors hover:border-ember hover:text-ember disabled:opacity-40";
const field = "border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink";

export default function SettingsAdmin() {
  const [methods, setMethods] = useState<SM[]>([]);
  const [areas, setAreas] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [freeFrom, setFreeFrom] = useState("");
  const [freeMsg, setFreeMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: m }, { data: a }, { data: s }] = await Promise.all([
      supabase.from("shipping_methods").select("*").order("sort_order"),
      supabase.from("acs_remote_areas").select("postcode_prefix").order("postcode_prefix"),
      supabase.from("shop_settings").select("value").eq("key", "free_shipping_from").maybeSingle(),
    ]);
    const v = (s as { value: unknown } | null)?.value;
    setFreeFrom(typeof v === "number" && v > 0 ? String(v) : "");
    setMethods((m ?? []) as SM[]);
    setAreas(((a ?? []) as { postcode_prefix: string }[]).map((x) => x.postcode_prefix).join(", "));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function saveMethod(m: SM) {
    const { error } = await supabase.from("shipping_methods").update({ cost: m.cost, remote_cost: m.remote_cost, active: m.active }).eq("code", m.code);
    setMsg(error ? error.message : "Αποθηκεύτηκε ✓");
  }

  async function saveAreas() {
    const list = Array.from(new Set(areas.split(/[\s,;]+/).map((s) => s.trim()).filter((s) => /^[0-9]{2,5}$/.test(s))));
    const del = await supabase.from("acs_remote_areas").delete().neq("postcode_prefix", "");
    if (del.error) { setMsg(del.error.message); return; }
    if (list.length) {
      const { error } = await supabase.from("acs_remote_areas").insert(list.map((p) => ({ postcode_prefix: p, note: "admin" })));
      if (error) { setMsg(error.message); return; }
    }
    setMsg(`Αποθηκεύτηκαν ${list.length} ΤΚ/πρόθεμα ΔΠ ✓`);
    load();
  }

  async function saveFree() {
    setFreeMsg(null);
    const n = freeFrom.trim() === "" ? 0 : Number(freeFrom.replace(",", "."));
    if (!isFinite(n) || n < 0) { setFreeMsg("Βάλε έγκυρο ποσό (ή κενό για καθόλου δωρεάν μεταφορικά)."); return; }
    const { error } = await supabase.from("shop_settings").upsert({ key: "free_shipping_from", value: n, updated_at: new Date().toISOString() });
    setFreeMsg(error ? error.message : n > 0 ? `✓ Δωρεάν μεταφορικά από ${n} €` : "✓ Χωρίς δωρεάν μεταφορικά");
  }

  return (
    <div className="flex flex-col gap-8 text-sm">
      <div className="flex flex-col gap-3 rounded-xl border border-line p-4">
        <b>🚚 Δωρεάν μεταφορικά</b>
        <p className="font-serif text-wood">
          Από αυτό το ποσό και πάνω (μετά την έκπτωση κουπονιού) τα μεταφορικά είναι δωρεάν, για όλους τους τρόπους αποστολής. Άφησέ το κενό για να το σταματήσεις.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">Από €
            <input className={`${field} w-24`} inputMode="decimal" value={freeFrom} onChange={(e) => setFreeFrom(e.target.value)} placeholder="π.χ. 50" />
          </label>
          <button className={btn} onClick={saveFree}>Αποθήκευση</button>
          {freeMsg && <span className="text-wood">{freeMsg}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <b>Μεταφορικά</b>
        {methods.map((m, i) => (
          <div key={m.code} className="flex flex-wrap items-center gap-3 border border-line p-3">
            <span className="w-56">{m.label}</span>
            <label className="flex items-center gap-2">Κόστος €
              <input className={`${field} w-20`} inputMode="decimal" value={m.cost} onChange={(e) => setMethods(methods.map((x, k) => k === i ? { ...x, cost: Number(e.target.value.replace(",", ".")) || 0 } : x))} /></label>
            {m.code === "acs" && (
              <label className="flex items-center gap-2">ΔΠ €
                <input className={`${field} w-20`} inputMode="decimal" value={m.remote_cost ?? ""} onChange={(e) => setMethods(methods.map((x, k) => k === i ? { ...x, remote_cost: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) || 0 } : x))} /></label>
            )}
            <label className="flex items-center gap-2"><input type="checkbox" checked={m.active} onChange={(e) => setMethods(methods.map((x, k) => k === i ? { ...x, active: e.target.checked } : x))} /> Ενεργό</label>
            <button className={btn} onClick={() => saveMethod(m)}>Αποθήκευση</button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <b>Δυσπρόσιτες περιοχές ACS (ΔΠ)</b>
        <p className="font-serif text-wood">Βάλε πλήρεις ΤΚ (5 ψηφία) ή προθέματα (π.χ. 84 = όλοι οι ΤΚ που ξεκινούν από 84), χωρισμένα με κόμμα, κενό ή αλλαγή γραμμής. Αντικαθιστά την υπάρχουσα λίστα.</p>
        <textarea className={`${field} font-mono`} rows={8} value={areas} onChange={(e) => setAreas(e.target.value)} />
        <button className={`${btn} w-fit`} onClick={saveAreas}>Αποθήκευση λίστας ΔΠ</button>
      </div>
      {msg && <span className="text-wood">{msg}</span>}
    </div>
  );
}
