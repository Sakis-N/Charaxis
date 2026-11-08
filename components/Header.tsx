"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "#categories", label: "Κατηγορίες" },
  { href: "#custom", label: "Φτιάξε το δικό σου" },
  { href: "#quote", label: "Ζήτα Προσφορά" },
  { href: "#contact", label: "Επικοινωνία" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    function onAdd() {
      // Το bump παίζει όταν "φτάνει" η κουκκίδα (~700ms).
      t = setTimeout(() => {
        setBump(true);
        t2 = setTimeout(() => setBump(false), 350);
      }, 650);
    }
    window.addEventListener("cart:add", onAdd);
    return () => {
      window.removeEventListener("cart:add", onAdd);
      if (t) clearTimeout(t);
      if (t2) clearTimeout(t2);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-16 md:py-5">
        <Link
          href="/"
          className="text-[19px] font-semibold tracking-tight transition-colors duration-200 hover:text-ember md:text-[21px]"
        >
          Charaxis
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 text-[15px] md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-ink after:transition-all after:duration-300 after:ease-out hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-5">
          <button
            id="cart-button"
            aria-label="Καλάθι"
            className={`flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-all duration-200 hover:border-ember hover:text-ember md:px-5 ${
              bump ? "scale-110 border-ember text-ember" : "border-ink"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 4h2l2.4 12.6a2 2 0 002 1.4h8.2a2 2 0 002-1.6L21 8H6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="21" r="1.4" fill="currentColor" />
              <circle cx="18" cy="21" r="1.4" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Καλάθι</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
          >
            <span
              className={`h-px w-5 bg-ink transition-transform duration-300 ease-out ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-ink transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-px w-5 bg-ink transition-transform duration-300 ease-out ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        className={`overflow-hidden border-t border-line transition-[max-height] duration-300 ease-out md:hidden ${
          open ? "max-h-80" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded px-2 py-3 text-base active:bg-line/40"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
