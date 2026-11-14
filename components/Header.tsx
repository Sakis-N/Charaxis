"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { getActiveCategories, type NavCategory } from "@/lib/categories";
import { PRODUCTION_TIME } from "@/lib/business";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [cats, setCats] = useState<NavCategory[]>([]);
  const catRef = useRef<HTMLDivElement>(null);
  const { count, ready } = useCart();

  // Οι ενεργές κατηγορίες για το αναδιπλούμενο μενού.
  useEffect(() => {
    let alive = true;
    getActiveCategories().then((c) => {
      if (alive) setCats(c);
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

  const navItem =
    "relative py-1 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:text-ember after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-ember after:transition-all after:duration-300 after:ease-out hover:after:w-full";

  return (
    <>
      {/* Λεπτή μπάρα πληροφοριών */}
      <div className="bg-ink px-5 py-2 text-center text-[12px] tracking-wide text-paper/90 md:text-[12.5px]">
        Φτιάχνεται ένα-ένα, κατόπιν παραγγελίας
        <span className="mx-2.5 text-ember" aria-hidden="true">·</span>
        <span className="hidden sm:inline">Παραγωγή σε {PRODUCTION_TIME}</span>
        <span className="sm:hidden">{PRODUCTION_TIME}</span>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3 md:px-16 md:py-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition-colors duration-200 hover:text-ember md:gap-4"
          >
            <Image
              src="/brand/charaxis-logo.jpg"
              alt=""
              width={72}
              height={72}
              className="h-12 w-12 rounded-full shadow-sm md:h-[58px] md:w-[58px]"
              priority
            />
            <span className="flex flex-col leading-none">
              <span className="text-[20px] font-semibold tracking-tight md:text-[24px]">Charaxis</span>
              <span className="mt-1 hidden text-[10.5px] font-medium uppercase tracking-[0.22em] text-wood sm:block">
                Laser Creations
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center justify-center gap-10 md:flex">
            <Link href="/proionta" className={navItem}>
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
                className={`${navItem} flex items-center gap-1.5`}
              >
                Κατηγορίες
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {catOpen && (
                <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4">
                  <div className="w-[340px] border border-line bg-paper p-2 shadow-xl">
                    {cats.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/kategories/${c.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="group flex items-center gap-4 px-3 py-2.5 transition-colors duration-150 hover:bg-line/40"
                      >
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-line bg-line/40">
                          {c.cover && (
                            <Image src={c.cover} alt="" fill sizes="56px" className="object-cover" />
                          )}
                        </span>
                        <span className="flex flex-col">
                          <span className="text-[15px] font-medium transition-colors duration-150 group-hover:text-ember">
                            {c.name}
                          </span>
                          {c.count > 0 && (
                            <span className="text-[12.5px] text-wood">
                              {c.count} {c.count === 1 ? "προϊόν" : "προϊόντα"}
                            </span>
                          )}
                        </span>
                      </Link>
                    ))}
                    <Link
                      href="/proionta"
                      onClick={() => setCatOpen(false)}
                      className="mt-1 block border-t border-line px-3 pb-1.5 pt-3 text-[13px] text-wood transition-colors duration-150 hover:text-ember"
                    >
                      Δες όλα τα προϊόντα →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/epikoinonia" className={navItem}>
              Επικοινωνία
            </Link>
          </nav>

          <div className="flex items-center justify-end gap-3 md:gap-4">
            <Link
              href="/prosfora"
              className="hidden bg-ink px-5 py-2.5 text-[13px] font-medium text-paper transition-colors duration-200 hover:bg-ember md:block"
            >
              Ζήτα προσφορά
            </Link>

            <Link
              id="cart-button"
              href="/kalathi"
              aria-label="Καλάθι"
              className={`flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-all duration-200 hover:border-ember hover:text-ember md:px-4 md:py-2.5 ${
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
              <span className={`h-px w-5 bg-ink transition-transform duration-300 ease-out ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-ink transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`h-px w-5 bg-ink transition-transform duration-300 ease-out ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div
          className={`overflow-hidden border-t border-line transition-[max-height] duration-300 ease-out md:hidden ${
            open ? "max-h-[40rem]" : "max-h-0 border-t-0"
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
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${mobileCatOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {mobileCatOpen && (
              <div className="mb-1 flex flex-col gap-0.5 border-l border-line pl-3">
                {cats.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/kategories/${c.slug}`}
                    onClick={() => { setOpen(false); setMobileCatOpen(false); }}
                    className="flex items-center gap-3 rounded px-2 py-2 active:bg-line/40"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-line bg-line/40">
                      {c.cover && <Image src={c.cover} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="text-[15px] text-wood">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/epikoinonia" onClick={() => setOpen(false)} className="rounded px-2 py-3 text-base active:bg-line/40">
              Επικοινωνία
            </Link>
            <Link
              href="/prosfora"
              onClick={() => setOpen(false)}
              className="mt-2 bg-ink px-4 py-3.5 text-center text-[15px] font-medium text-paper active:bg-ember"
            >
              Ζήτα προσφορά
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
