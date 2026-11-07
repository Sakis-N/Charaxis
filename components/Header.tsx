"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "#categories", label: "Κατηγορίες" },
  { href: "#custom", label: "Φτιάξε το δικό σου" },
  { href: "#quote", label: "Ζήτα Προσφορά" },
  { href: "#contact", label: "Επικοινωνία" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-16 md:py-5">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-wide transition-colors duration-200 hover:text-accent md:text-2xl"
        >
          CHARAXIS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 text-[15px] font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-accent after:transition-all after:duration-300 after:ease-out hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="hidden cursor-pointer transition-transform duration-200 ease-out hover:scale-110 sm:block"
          >
            <circle cx="11" cy="11" r="7" stroke="#2A2420" strokeWidth="1.6" />
            <path
              d="M20 20L16.5 16.5"
              stroke="#2A2420"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          <button
            aria-label="Καλάθι"
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-md hover:shadow-accent/25 md:px-5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 4h2l2.4 12.6a2 2 0 002 1.4h8.2a2 2 0 002-1.6L21 8H6"
                stroke="#FFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="21" r="1.4" fill="#FFF" />
              <circle cx="18" cy="21" r="1.4" fill="#FFF" />
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
              className={`h-[1.5px] w-5 bg-ink transition-transform duration-300 ease-out ${
                open ? "translate-y-[6.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[1.5px] w-5 bg-ink transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-[1.5px] w-5 bg-ink transition-transform duration-300 ease-out ${
                open ? "-translate-y-[6.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        className={`overflow-hidden border-t border-border transition-[max-height] duration-300 ease-out md:hidden ${
          open ? "max-h-80" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-base font-medium transition-colors duration-200 active:bg-border/40"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
