"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { PRODUCTION_TIME } from "@/lib/business";
import FreeShippingBar from "@/components/FreeShippingBar";

// Πλαϊνό συρτάρι που ανοίγει μόλις μπει κάτι στο καλάθι: ο πελάτης βλέπει
// αμέσως τι πρόσθεσε και διαλέγει "Ολοκλήρωση" ή "Συνέχεια αγορών".
export default function CartDrawer() {
  const { items, ready, subtotal, setQty, remove } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    function onAdd() {
      // Αφήνουμε την "πετώντας" κουκκίδα να φτάσει πρώτα στο καλάθι.
      t = setTimeout(() => setOpen(true), 750);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("cart:add", onAdd);
    window.addEventListener("cart:open", onOpen);
    return () => {
      window.removeEventListener("cart:add", onAdd);
      window.removeEventListener("cart:open", onOpen);
      if (t) clearTimeout(t);
    };
  }, []);

  // Κλείνει σε αλλαγή σελίδας.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] transition-[visibility] duration-300 ${open ? "visible" : "pointer-events-none invisible"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Καλάθι"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold">
            Το καλάθι σου{items.length > 0 ? ` (${items.reduce((n, i) => n + i.quantity, 0)})` : ""}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Κλείσιμο καλαθιού"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-line/50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-4 px-6 py-10">
            <p className="font-serif text-wood">Το καλάθι σου είναι άδειο.</p>
            <Link href="/proionta" className="bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-ember">
              Δες τα προϊόντα
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((it) => (
                <li key={it.key} className="flex gap-4 py-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-line bg-line/40">
                    {it.image && <Image src={it.image} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/proionta/${it.slug}`} className="text-[14.5px] font-medium leading-snug hover:text-ember">
                        {it.name}
                      </Link>
                      <span className="shrink-0 text-[14.5px] font-medium">{(it.price * it.quantity).toFixed(2)} €</span>
                    </div>
                    {it.custom_design?.fields.slice(0, 3).map((f) => (
                      <div key={f.id} className="truncate text-[12.5px] text-wood">
                        <span className="text-faint">{f.label}:</span> {f.value}
                      </div>
                    ))}
                    {it.custom_design && it.custom_design.photos.length > 0 && (
                      <div className="text-[12.5px] text-wood">📷 Φωτογραφία/αρχείο ✓</div>
                    )}
                    <div className="mt-1.5 flex items-center gap-4 text-sm">
                      <div className="flex items-center border border-line">
                        <button type="button" aria-label="Μείωση" onClick={() => setQty(it.key, it.quantity - 1)} className="px-2.5 py-1 hover:text-ember">−</button>
                        <span className="min-w-8 text-center tabular-nums">{it.quantity}</span>
                        <button type="button" aria-label="Αύξηση" onClick={() => setQty(it.key, it.quantity + 1)} className="px-2.5 py-1 hover:text-ember">+</button>
                      </div>
                      <button type="button" onClick={() => remove(it.key)} className="text-[13px] text-wood underline underline-offset-2 hover:text-ember">
                        Αφαίρεση
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t border-line px-6 py-5" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>
              <FreeShippingBar amount={subtotal} compact />
              <div className="flex justify-between text-[15px]">
                <span className="text-wood">Υποσύνολο</span>
                <span className="font-semibold">{subtotal.toFixed(2)} €</span>
              </div>
              <p className="-mt-1 text-[12.5px] text-faint">
                Τα μεταφορικά υπολογίζονται στο επόμενο βήμα · Παραγωγή σε {PRODUCTION_TIME}
              </p>
              <Link
                href="/checkout"
                className="bg-ink px-6 py-3.5 text-center text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember"
              >
                Ολοκλήρωση παραγγελίας
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="py-1.5 text-center text-sm text-wood underline underline-offset-2 hover:text-ember"
              >
                Συνέχεια αγορών
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
