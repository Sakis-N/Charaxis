"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase/client";

const navLinks = [
  { href: "/proionta", label: "Προϊόντα" },
  { href: "/prosfora", label: "Ζήτα Προσφορά" },
  { href: "/epikoinonia", label: "Επικοινωνία" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [cats, setCats] = useState<{ name: string; slug: string }[]>([]);
  const catRef = useRef<HTMLDivElement>(null);
  const { count, ready } = useCart();

  // Οι ενεργές κατηγορίες για το αναδιπλούμενο μενού.
  useEffect(() => {
    let alive = true;
    supabase
      .from("categories")
      .select("name, slug")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (alive && data) setCats(data as { name: string; slug: string }[]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Κλείνει με κλικ έξω ή με Escape.
  useEffect(() => {
    if (!catOpen) return;
    function onDown(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCatOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

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
      <div className="flex items-center justify-between gap-4 px-5 py-3 md:px-16 md:py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-[20px] font-semibold tracking-tight transition-colors duration-200 hover:text-ember md:gap-4 md:text-[26px]"
        >
          <Image
            src="/brand/charaxis-logo.jpg"
            alt=""
            width={72}
            height={72}
            className="h-12 w-12 rounded-full shadow-sm md:h-[60px] md:w-[60px]"
            priority
          />
          Charaxis
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 text-[15px] md:flex">
          <Link href="/proionta" className="relative py-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-ink after:transition-all after:duration-300 after:ease-out hover:after:w-full">
            Προϊόντα
          </Link>

          <div
            ref={catRef}
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={catOpen}
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1.5 py-1 transition-colors duration-200 hover:text-ember"
            >
              Κατηγορίες
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {catOpen && (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
                <div className="min-w-[230px] border border-line bg-paper py-2 shadow-lg">
                  {cats.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/kategories/${c.slug}`}
                      onClick={() => setCatOpen(false)}
                      className="block px-5 py-2.5 text-[15px] transition-colors duration-150 hover:bg-line/40 hover:text-ember"
                    >
                      {c.name}
                    </Link>
                  ))}
                  <Link
                    href="/proionta"
                    onClick={() => setCatOpen(false)}
                    className="mt-1 block border-t border-line px-5 py-2.5 text-[13px] text-wood transition-colors duration-150 hover:text-ember"
                  >
                    Όλα τα προϊόντα
                  </Link>
                </div>
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
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
          <Link
            id="cart-button"
            href="/kalathi"
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
            {ready && count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[11px] font-semibold text-paper">
                {count}
              </span>
            )}
          </Link>

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
          open ? "max-h-[36rem]" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-3">
          <Link href="/proionta" onClick={() => setOpen(false)} className="rounded px-2 py-3 text-base active:bg-line/40">
            Προϊόντα
          </Link>

          <button
            type="button"
            aria-expanded={mobileCatOpen}
            onClick={() => setMobileCatOpen((v) => !v)}
            className="flex items-center justify-between rounded px-2 py-3 text-left text-base active:bg-line/40"
          >
            Κατηγορίες
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${mobileCatOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {mobileCatOpen && (
            <div className="mb-1 flex flex-col border-l border-line pl-3">
              {cats.map((c) => (
                <Link
                  key={c.slug}
                  href={`/kategories/${c.slug}`}
                  onClick={() => { setOpen(false); setMobileCatOpen(false); }}
                  className="rounded px-3 py-2.5 text-[15px] text-wood active:bg-line/40"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {navLinks.slice(1).map((link) => (
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
