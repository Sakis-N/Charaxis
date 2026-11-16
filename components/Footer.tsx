"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { getActiveCategories, type NavCategory } from "@/lib/categories";

const link = "text-paper/65 transition-colors duration-200 hover:text-paper";

export default function Footer() {
  const [categories, setCategories] = useState<NavCategory[]>([]);
  useEffect(() => {
    let alive = true;
    getActiveCategories().then((c) => {
      if (alive) setCategories(c);
    });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <footer id="contact" className="bg-ink text-paper">
      {/* Μεγάλο κάλεσμα */}
      <div className="flex flex-col gap-6 border-b border-paper/10 px-6 py-14 md:flex-row md:items-end md:justify-between md:px-12 md:py-20 lg:px-16">
        <h2 className="max-w-2xl text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[52px]">
          Κάτι μικρό, ξύλινο,{" "}
          <span className="font-serif font-normal italic text-ember">με το όνομά σου.</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/proionta" className="rounded-full bg-paper px-6 py-3.5 text-[14px] font-semibold text-ink transition-colors hover:bg-ember hover:text-paper">
            Ξεκίνα εδώ
          </Link>
          <Link href="/prosfora" className="rounded-full border border-paper/30 px-6 py-3.5 text-[14px] font-semibold transition-colors hover:border-paper">
            Ζήτα προσφορά
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-12 lg:px-16">
        <div className="col-span-2 flex max-w-[300px] flex-col gap-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/brand/charaxis-logo.jpg" alt="" width={56} height={56} className="h-14 w-14 rounded-full ring-1 ring-paper/20" />
            <span className="flex flex-col leading-none">
              <span className="text-[20px] font-bold">Charaxis</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-paper/50">Laser Creations</span>
            </span>
          </div>
          <p className="font-serif text-[15px] leading-relaxed text-paper/60">
            Μικρό εργαστήριο, custom laser χαράξεις σε ξύλο. Κάθε κομμάτι φτιάχνεται ένα-ένα, κατόπιν παραγγελίας.
          </p>
          {BUSINESS.instagram && (
            <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-[13px] transition-colors hover:border-ember hover:text-ember">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
              </svg>
              Δες τη δουλειά μας στο Instagram
            </a>
          )}
        </div>

        <div className="flex flex-col gap-3 text-[14px]">
          <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-paper/45">Κατάστημα</div>
          <Link href="/proionta" className={link}>Όλα τα προϊόντα</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/kategories/${c.slug}`} className={link}>{c.name}</Link>
          ))}
        </div>

        <div className="flex flex-col gap-3 text-[14px]">
          <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-paper/45">Βοήθεια</div>
          <Link href="/apostoli-pliromi" className={link}>Αποστολή & πληρωμή</Link>
          <Link href="/epistrofes" className={link}>Επιστροφές & ακυρώσεις</Link>
          <Link href="/faq" className={link}>Συχνές ερωτήσεις</Link>
          <Link href="/oroi-xrhshs" className={link}>Όροι χρήσης</Link>
          <Link href="/aporrito" className={link}>Πολιτική απορρήτου</Link>
        </div>

        <div className="flex flex-col gap-3 text-[14px]">
          <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-paper/45">Επικοινωνία</div>
          <a href={`mailto:${BUSINESS.email}`} className={`${link} break-all`}>{BUSINESS.email}</a>
          {BUSINESS.phone && <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className={link}>{BUSINESS.phone}</a>}
          {BUSINESS.facebook && <a href={BUSINESS.facebook} target="_blank" rel="noreferrer" className={link}>Facebook</a>}
          <Link href="/epikoinonia" className={link}>Φόρμα επικοινωνίας</Link>
          <Link href="/prosfora" className={link}>Ζήτα προσφορά</Link>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-paper/10 px-6 py-6 text-center text-[12px] text-paper/45 md:flex-row md:justify-between md:px-12 md:text-left lg:px-16">
        <span>© {new Date().getFullYear()} Charaxis. Όλα τα δικαιώματα κατοχυρωμένα.</span>
        {(BUSINESS.legalName || BUSINESS.afm) && (
          <span>{[BUSINESS.legalName, BUSINESS.afm ? `ΑΦΜ ${BUSINESS.afm}` : null, BUSINESS.doy ? `ΔΟΥ ${BUSINESS.doy}` : null].filter(Boolean).join(" · ")}</span>
        )}
      </div>
    </footer>
  );
}
