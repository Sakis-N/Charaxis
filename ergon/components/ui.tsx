import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="text-sm text-brand-600 hover:underline print:hidden">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 break-words">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ title, actions, children, className = "", pad = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
        </div>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Badge({ children, cls = "bg-gray-100 text-gray-700" }: { children: ReactNode; cls?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function Dot({ color }: { color?: string | null }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color || "#9ca3af" }} />;
}

const btnBase = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50";
export const btn = {
  primary: `${btnBase} bg-brand-600 text-white hover:bg-brand-700`,
  secondary: `${btnBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`,
  danger: `${btnBase} border border-red-200 bg-white text-red-600 hover:bg-red-50`,
  ghost: `${btnBase} text-gray-600 hover:bg-gray-100`,
  small: "inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50",
};

export function LinkButton({ href, children, variant = "secondary", target }: { href: string; children: ReactNode; variant?: keyof typeof btn; target?: string }) {
  return (
    <Link href={href} className={btn[variant]} target={target}>
      {children}
    </Link>
  );
}

export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function Field({ label, children, className = "", hint }: { label: string; children: ReactNode; className?: string; hint?: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; className?: string; hint?: ReactNode };
export function Input({ label, className, hint, ...rest }: InputProps) {
  return (
    <Field label={label} className={className} hint={hint}>
      <input {...rest} className={inputCls} />
    </Field>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; className?: string };
export function Textarea({ label, className, rows = 3, ...rest }: TextareaProps) {
  return (
    <Field label={label} className={className}>
      <textarea rows={rows} {...rest} className={inputCls} />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  className?: string;
  options: { value: string | number; label: string }[];
  empty?: string;
};
export function Select({ label, className, options, empty, ...rest }: SelectProps) {
  return (
    <Field label={label} className={className}>
      <select {...rest} className={inputCls}>
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">{children}</div>;
}

export function Stat({ label, value, href, tone = "text-gray-900", sub }: { label: string; value: ReactNode; href?: string; tone?: string; sub?: ReactNode }) {
  const inner = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-2 align-top ${className}`}>{children}</td>;
}

export function DL({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {items
        .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
        .map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-gray-500">{k}</dt>
            <dd className="break-words text-gray-900">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
