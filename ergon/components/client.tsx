"use client";

import { useFormStatus } from "react-dom";
import { useMemo, useState, type ReactNode } from "react";
import { btn, inputCls } from "./ui";

export function SubmitButton({ children, variant = "primary", className = "", name, value }: { children: ReactNode; variant?: keyof typeof btn; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${btn[variant]} ${className}`} name={name} value={value}>
      {pending ? "…" : children}
    </button>
  );
}

/** A form whose submit asks for confirmation first */
export function ConfirmForm({ action, children, message = "Σίγουρα;", className = "inline" }: { action: (fd: FormData) => void | Promise<void>; children: ReactNode; message?: string; className?: string }) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

type Opt = { id: number; name: string; customer_id?: number; company?: string | null };

/** Customer → installation → project dependent selects */
export function CustomerPicker({
  customers,
  installations,
  projects,
  defaultCustomer,
  defaultInstallation,
  defaultProject,
  showProject = true,
}: {
  customers: Opt[];
  installations: Opt[];
  projects?: Opt[];
  defaultCustomer?: number | null;
  defaultInstallation?: number | null;
  defaultProject?: number | null;
  showProject?: boolean;
}) {
  const [cust, setCust] = useState<string>(defaultCustomer ? String(defaultCustomer) : "");
  const [filter, setFilter] = useState("");
  const inst = useMemo(() => installations.filter((i) => String(i.customer_id) === cust), [installations, cust]);
  const proj = useMemo(() => (projects || []).filter((i) => String(i.customer_id) === cust), [projects, cust]);
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(f) || (c.company || "").toLowerCase().includes(f) || String(c.id) === cust);
  }, [customers, filter, cust]);
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Πελάτης *</span>
        {customers.length > 12 && (
          <input className={`${inputCls} mb-1`} placeholder="Φίλτρο πελάτη…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        )}
        <select name="customer_id" required className={inputCls} value={cust} onChange={(e) => setCust(e.target.value)}>
          <option value="">— Επιλογή —</option>
          {shown.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.company ? ` (${c.company})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Εγκατάσταση</span>
        <select name="installation_id" className={inputCls} defaultValue={defaultInstallation ?? ""} key={`i-${cust}`}>
          <option value="">— Καμία —</option>
          {inst.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      {showProject && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Έργο</span>
          <select name="project_id" className={inputCls} defaultValue={defaultProject ?? ""} key={`p-${cust}`}>
            <option value="">— Κανένα —</option>
            {proj.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

/** Material picker that fills name/unit/price fields */
export function MaterialLine({ materials }: { materials: { id: number; name: string; unit: string; unit_price: number; unit_cost: number; stock: number }[] }) {
  const [m, setM] = useState<string>("");
  const sel = materials.find((x) => String(x.id) === m);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
      <select name="material_id" className={`${inputCls} col-span-2`} value={m} onChange={(e) => setM(e.target.value)}>
        <option value="">— Από αποθήκη ή ελεύθερο —</option>
        {materials.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name} ({x.stock} {x.unit})
          </option>
        ))}
      </select>
      <input name="name" placeholder="Περιγραφή" className={`${inputCls} col-span-2`} key={`n${m}`} defaultValue={sel?.name ?? ""} required />
      <input name="qty" placeholder="Ποσ." className={inputCls} defaultValue="1" inputMode="decimal" />
      <input name="unit_price" placeholder="Τιμή" className={inputCls} key={`p${m}`} defaultValue={sel ? String(sel.unit_price) : ""} inputMode="decimal" />
      <input type="hidden" name="unit" value={sel?.unit ?? ""} />
      <input type="hidden" name="unit_cost" value={sel ? String(sel.unit_cost) : ""} />
    </div>
  );
}

/** Repeating quote item rows */
export function QuoteItemsEditor({ items }: { items: { description: string; qty: number; unit: string | null; unit_price: number }[] }) {
  const [rows, setRows] = useState(items.length ? items : [{ description: "", qty: 1, unit: "τεμ", unit_price: 0 }]);
  const total = rows.reduce((s, r) => s + Number(r.qty || 0) * Number(r.unit_price || 0), 0);
  const upd = (i: number, k: string, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-gray-500 sm:grid">
        <div className="col-span-6">Περιγραφή</div>
        <div className="col-span-2">Ποσότητα</div>
        <div className="col-span-1">Μον.</div>
        <div className="col-span-2">Τιμή μον.</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 rounded-lg bg-gray-50 p-2 sm:bg-transparent sm:p-0">
          <input name="item_description" value={r.description} onChange={(e) => upd(i, "description", e.target.value)} placeholder="Περιγραφή" className={`${inputCls} col-span-12 sm:col-span-6`} />
          <input name="item_qty" value={r.qty} onChange={(e) => upd(i, "qty", e.target.value)} inputMode="decimal" className={`${inputCls} col-span-4 sm:col-span-2`} />
          <input name="item_unit" value={r.unit ?? ""} onChange={(e) => upd(i, "unit", e.target.value)} className={`${inputCls} col-span-3 sm:col-span-1`} />
          <input name="item_price" value={r.unit_price} onChange={(e) => upd(i, "unit_price", e.target.value)} inputMode="decimal" className={`${inputCls} col-span-4 sm:col-span-2`} />
          <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="col-span-1 text-red-500 hover:text-red-700" title="Αφαίρεση">
            ✕
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" className={btn.small} onClick={() => setRows((rs) => [...rs, { description: "", qty: 1, unit: "τεμ", unit_price: 0 }])}>
          + Γραμμή
        </button>
        <div className="text-sm text-gray-600">
          Σύνολο (προ ΦΠΑ/έκπτωσης): <b>{new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(total)}</b>
        </div>
      </div>
    </div>
  );
}

export function PrintButton({ label = "Εκτύπωση / PDF" }: { label?: string }) {
  return (
    <button type="button" className={btn.secondary} onClick={() => window.print()}>
      🖨 {label}
    </button>
  );
}

export function CopyText({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={text} className={`${inputCls} font-mono text-xs`} onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className={btn.secondary}
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }}
      >
        {ok ? "✓" : "Αντιγραφή"}
      </button>
    </div>
  );
}
