"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { getActiveCategories, type NavCategory } from "@/lib/categories";
import { BUSINESS, PRODUCTION_TIME } from "@/lib/business";

// Σύντομα, ώστε να χωράνε σε μία γραμμή και στο κινητό.
const BASE_MESSAGES = [
  `Χειροποίητο · Παραγωγή σε ${PRODUCTION_TIME}`,
  "Αποστολή σε όλη την Ελλάδα · ACS, BoxNow, Skroutz",
];
// Εποχικό μήνυμα μόνο Νοέμβριο–Δεκέμβριο.
const XMAS = "🎄 Δώρα Χριστουγέννων: παράγγειλε νωρίς";

function AnnouncementBar() {
  const [i, setI] = useState(0);
  const [messages, setMessages] = useState(BASE_MESSAGES);
  useEffect(() => {
    const m = new Date().getMonth();
    if (m === 10 || m === 11) setMessages([XMAS, ...BASE_MESSAGES]);
  }, []);
  const MESSAGES = messages;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 4500);
    return () => clearInterval(t);
  }, [MESSAGES.length]);
  return (
    <div className="relative h-9 overflow-hidden bg-ink text-[12px] tracking-wide text-paper/90 md:text-[12.5px]">
      {MESSAGES.map((m, idx) => (
        <p
          key={m}
          aria-hidden={idx !== i}
          className={`absolute inset-0 flex items-center justify-center truncate whitespace-nowrap px-4 text-center transition-all duration-500 ${
            idx === i ? "translate-y-0 opacity-100" : idx < i ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
          }`}
        >
          {m}
        </p>
      ))}
    </div>
  );
}

const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 8h14l-1.2 11.1a2 2 0 01-2 1.9H8.2a2 2 0 01-2-1.9L5 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 10V6.5a3 3 0 016 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const InstaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
  </svg>
);

export default function Header() {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cats, setCats] = useState<NavCategory[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { count, ready } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    getActiveCategories().then((c) => {
      if (alive) setCats(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !megaOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMegaOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    if (open) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, megaOpen]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    function onAdd() {
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

  function openMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }
  function closeMegaSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  }

  const navItem =
    "relative whitespace-nowrap py-2 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 hover:text-ember after:absolute after:bottom-0.5 after:left-0 after:h-[1.5px] after:w-0 after:bg-ember after:transition-all after:duration-300 after:ease-out hover:after:w-full";

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 border-b bg-paper/90 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${
          scrolled ? "border-line shadow-[0_6px_24px_-12px_rgba(27,23,20,0.25)]" : "border-transparent"
        }`}
        onMouseLeave={closeMegaSoon}
      >
        <div
          className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 transition-[padding] duration-300 md:px-12 lg:px-16 ${
            scrolled ? "py-2.5" : "py-3.5 md:py-4"
          }`}
        >
          {/* Mobile menu toggle (αριστερά στο κινητό) */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Άνοιγμα μενού"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="-ml-1 flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <span className="h-[1.5px] w-5 bg-ink" />
              <span className="h-[1.5px] w-5 bg-ink" />
              <span className="h-[1.5px] w-3.5 self-start bg-ink" style={{ marginLeft: 10 }} />
            </button>
            <Link href="/" className="flex items-center gap-3 md:gap-3.5" aria-label="Charaxis — αρχική">
              <Image
                src="/brand/charaxis-logo.jpg"
                alt=""
                width={72}
                height={72}
                className={`rounded-full shadow-sm ring-1 ring-line transition-all duration-300 ${
                  scrolled ? "h-10 w-10 md:h-11 md:w-11" : "h-11 w-11 md:h-[54px] md:w-[54px]"
                }`}
                priority
              />
              <span className="flex flex-col leading-none">
                <span className="text-[20px] font-bold tracking-tight md:text-[23px]">Charaxis</span>
                <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.26em] text-wood sm:block">
                  Laser Creations
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center justify-center gap-6 md:flex lg:gap-8 xl:gap-10" aria-label="Κύριο μενού">
            <Link href="/proionta" className={navItem} onMouseEnter={closeMegaSoon}>
              Προϊόντα
            </Link>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={megaOpen}
              onMouseEnter={openMega}
              onFocus={openMega}
              onClick={openMega}
              className={`${navItem} flex items-center gap-1.5 ${megaOpen ? "text-ember" : ""}`}
            >
              Κατηγορίες
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <Link href="/#idees-dorou" className={navItem} onMouseEnter={closeMegaSoon}>
              Ιδέες δώρου
            </Link>
            <Link href="/epikoinonia" className={navItem} onMouseEnter={closeMegaSoon}>
              Επικοινωνία
            </Link>
          </nav>

          <div className="flex items-center justify-end gap-2 md:gap-3">
            <Link
              href="/prosfora"
              className="hidden items-center gap-2 whitespace-nowrap border border-ink px-4 py-2.5 text-[13px] font-semibold transition-colors duration-200 hover:border-ember hover:bg-ember hover:text-paper 2xl:flex"
            >
              Ζήτα προσφορά
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("search:open"))}
              aria-label="Αναζήτηση"
              className="group flex h-10 items-center gap-2 rounded-full px-2.5 transition-colors hover:bg-line/50 md:border md:border-line md:pl-3.5 md:pr-2 md:hover:border-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span className="hidden text-[13px] text-wood lg:inline">Αναζήτηση</span>
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-display text-[10.5px] text-faint xl:inline">Ctrl K</kbd>
            </button>
            <Link
              href="/parakolouthisi"
              aria-label="Η παραγγελία μου"
              title="Η παραγγελία μου"
              className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-line/50 hover:text-ember md:flex"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </Link>
            {BUSINESS.instagram && (
              <a
                href={BUSINESS.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-line/50 hover:text-ember lg:flex"
              >
                <InstaIcon />
              </a>
            )}
            <Link
              id="cart-button"
              href="/kalathi"
              aria-label={`Καλάθι${count ? `, ${count} τεμάχια` : ""}`}
              onClick={(e) => {
                // Με προϊόντα στο καλάθι ανοίγει το πλαϊνό συρτάρι· αλλιώς η σελίδα καλαθιού.
                if (count > 0 && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("cart:open"));
                }
              }}
              className={`relative flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-paper transition-all duration-200 hover:bg-ember ${
                bump ? "scale-110 bg-ember" : ""
              }`}
            >
              <CartIcon />
              <span className="hidden sm:inline">Καλάθι</span>
              {ready && count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[11px] font-bold text-paper ring-2 ring-paper">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop mega menu */}
        <div
          onMouseEnter={openMega}
          onMouseLeave={closeMegaSoon}
          className={`absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_24px_48px_-24px_rgba(27,23,20,0.35)] transition-all duration-300 md:block ${
            megaOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="grid grid-cols-[1fr_260px] gap-10 px-12 py-8 lg:px-16">
            <div className="grid grid-cols-3 gap-5 lg:grid-cols-5">
              {cats.map((c) => (
                <Link key={c.slug} href={`/kategories/${c.slug}`} onClick={() => setMegaOpen(false)} className="group flex flex-col gap-2.5">
                  <span className="relative aspect-[4/5] overflow-hidden rounded-md bg-line/40">
                    {c.cover && (
                      <Image src={c.cover} alt="" fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </span>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14.5px] font-semibold transition-colors group-hover:text-ember">{c.name}</span>
                    {c.count > 0 && <span className="text-[12px] text-wood">{c.count}</span>}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex flex-col justify-between gap-6 rounded-md bg-ink p-6 text-paper">
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember">Κάτι μοναδικό;</span>
                <p className="font-serif text-[15px] leading-relaxed text-paper/80">
                  Ρολόγια, επιγραφές, εταιρικά δώρα ή ό,τι φανταστείς. Στείλε μας την ιδέα σου.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/prosfora" onClick={() => setMegaOpen(false)} className="bg-ember px-4 py-3 text-center text-[13px] font-semibold text-paper transition-colors hover:bg-ember-dark">
                  Ζήτα προσφορά
                </Link>
                <Link href="/proionta" onClick={() => setMegaOpen(false)} className="py-1.5 text-center text-[13px] text-paper/70 hover:text-paper">
                  Όλα τα προϊόντα →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu: πλήρης οθόνη από αριστερά */}
      <div className={`fixed inset-0 z-[95] md:hidden ${open ? "visible" : "invisible"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <nav
          aria-label="Μενού"
          className={`absolute inset-y-0 left-0 flex w-[88%] max-w-[380px] flex-col overflow-y-auto bg-paper transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="text-[18px] font-bold">Μενού</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Κλείσιμο μενού" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-line/50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-3 px-5 pt-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-wood">Κατηγορίες</span>
            <div className="grid grid-cols-2 gap-3">
              {cats.map((c) => (
                <Link key={c.slug} href={`/kategories/${c.slug}`} onClick={() => setOpen(false)} className="relative aspect-square overflow-hidden rounded-md bg-line/50">
                  {c.cover && <Image src={c.cover} alt="" fill sizes="45vw" className="object-cover" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                  <span className="absolute inset-x-2.5 bottom-2.5 text-[13.5px] font-semibold leading-tight text-paper">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col px-5 py-4">
            {[
              { href: "/proionta", label: "Όλα τα προϊόντα" },
              { href: "/#idees-dorou", label: "Ιδέες δώρου" },
              { href: "/parakolouthisi", label: "Πού είναι η παραγγελία μου;" },
              { href: "/faq", label: "Συχνές ερωτήσεις" },
              { href: "/epikoinonia", label: "Επικοινωνία" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-line py-3.5 text-[16px] font-medium">
                {l.label}
                <span className="text-wood">→</span>
              </Link>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-3 px-5 pb-8">
            <Link href="/prosfora" onClick={() => setOpen(false)} className="bg-ink px-4 py-3.5 text-center text-[15px] font-semibold text-paper active:bg-ember">
              Ζήτα προσφορά
            </Link>
            <div className="flex items-center justify-center gap-5 text-[13px] text-wood">
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              {BUSINESS.instagram && (
                <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-ink">
                  <InstaIcon />
                </a>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
