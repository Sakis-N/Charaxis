"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const NAV = [
  { href: "/", label: "Αρχική", icon: "🏠" },
  { href: "/calendar", label: "Ημερολόγιο", icon: "📅" },
  { href: "/jobs", label: "Εργασίες", icon: "🛠" },
  { href: "/customers", label: "Πελάτες", icon: "👥" },
  { href: "/installations", label: "Εγκαταστάσεις", icon: "🏢" },
  { href: "/projects", label: "Έργα", icon: "📁" },
  { href: "/map", label: "Χάρτης", icon: "🗺" },
  { href: "/quotes", label: "Προσφορές", icon: "📝" },
  { href: "/contracts", label: "Συμβόλαια", icon: "🔁" },
  { href: "/reminders", label: "Υπενθυμίσεις", icon: "⏰" },
  { href: "/finance", label: "Οικονομικά", icon: "💶" },
  { href: "/materials", label: "Υλικά", icon: "📦" },
  { href: "/team", label: "Τεχνικοί", icon: "👷" },
  { href: "/reports", label: "Αναφορές", icon: "📊" },
  { href: "/calls", label: "Κλήσεις", icon: "📞" },
  { href: "/settings", label: "Ρυθμίσεις", icon: "⚙️" },
];

const BOTTOM = ["/", "/calendar", "/jobs", "/customers"];

function active(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function Sidebar({ business }: { business: string }) {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-gray-200 bg-white lg:flex">
      <Link href="/" className="flex items-center gap-2 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">E</span>
        <span className="min-w-0">
          <span className="block font-bold leading-tight">Ergon</span>
          <span className="block truncate text-xs text-gray-500">{business}</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active(path, n.href) ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <span className="w-5 text-center">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur print:hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 lg:px-6">
          <button className="rounded-lg p-2 text-xl lg:hidden" onClick={() => setOpen(!open)} aria-label="Μενού">
            ☰
          </button>
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 Αναζήτηση πελάτη, τηλεφώνου, εργασίας, σειριακού…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </form>
          <Link href="/jobs/new" className="whitespace-nowrap rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            + Εργασία
          </Link>
        </div>
        {open && (
          <nav className="grid grid-cols-2 gap-1 border-t border-gray-100 p-3 sm:grid-cols-3 lg:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${active(path, n.href) ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-100"}`}>
                <span>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden">
        {NAV.filter((n) => BOTTOM.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-col items-center py-2 text-[11px] ${active(path, n.href) ? "font-semibold text-brand-700" : "text-gray-500"}`}>
            <span className="text-lg">{n.icon}</span>
            {n.label}
          </Link>
        ))}
        <button onClick={() => setOpen(!open)} className="flex flex-col items-center py-2 text-[11px] text-gray-500">
          <span className="text-lg">☰</span>Περισσότερα
        </button>
      </nav>
    </>
  );
}
