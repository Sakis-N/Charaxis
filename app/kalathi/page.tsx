"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart";

export default function CartPage() {
  const { items, ready, subtotal, setQty, remove } = useCart();

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex flex-col gap-8 px-6 py-12 md:px-16 md:py-16">
        <h1 className="text-[28px] font-medium md:text-[34px]">Καλάθι</h1>

        {!ready ? null : items.length === 0 ? (
          <div className="flex flex-col items-start gap-4">
            <p className="font-serif text-wood">Το καλάθι σου είναι άδειο.</p>
            <Link href="/proionta" className="bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember">
              Δες τα προϊόντα
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {items.map((it) => (
                <li key={it.key} className="flex gap-4 py-5">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-line">
                    {it.image ? (
                      <Image src={it.image} alt={it.name} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="placeholder-tile h-full" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Link href={`/proionta/${it.slug}`} className="font-medium transition-colors hover:text-ember">
                      {it.name}
                    </Link>
                    {it.custom_design?.fields.map((f) => (
                      <div key={f.id} className="break-words text-[13px] text-wood">
                        <span className="text-faint">{f.label}:</span> {f.value}
                      </div>
                    ))}
                    {it.custom_design && it.custom_design.photos.length > 0 && (
                      <div className="text-[13px] text-wood">📷 Φωτογραφία ανεβασμένη</div>
                    )}
                    <div className="mt-auto flex items-center gap-4 pt-2 text-sm">
                      <div className="flex items-center border border-line">
                        <button type="button" aria-label="Μείωση" onClick={() => setQty(it.key, it.quantity - 1)} className="px-3 py-1.5 hover:text-ember">−</button>
                        <span className="min-w-6 text-center">{it.quantity}</span>
                        <button type="button" aria-label="Αύξηση" onClick={() => setQty(it.key, it.quantity + 1)} className="px-3 py-1.5 hover:text-ember">+</button>
                      </div>
                      <button type="button" onClick={() => remove(it.key)} className="text-wood underline underline-offset-2 hover:text-ember">
                        Αφαίρεση
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 font-medium">{(it.price * it.quantity).toFixed(2)} €</div>
                </li>
              ))}
            </ul>

            <aside className="flex h-fit flex-col gap-4 border border-line p-6">
              <div className="flex justify-between text-sm">
                <span className="text-wood">Υποσύνολο</span>
                <span className="font-medium">{subtotal.toFixed(2)} €</span>
              </div>
              <p className="font-serif text-[13px] text-wood">Τα μεταφορικά υπολογίζονται στο επόμενο βήμα.</p>
              <Link href="/checkout" className="bg-ink px-7 py-3 text-center text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember">
                Συνέχεια στην παραγγελία
              </Link>
            </aside>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
