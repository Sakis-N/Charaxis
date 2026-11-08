import Link from "next/link";
import { BUSINESS } from "@/lib/business";

const link = "text-wood transition-colors duration-200 hover:text-ember";

export default function Footer() {
  return (
    <footer id="contact">
      <div className="flex flex-wrap justify-between gap-12 border-t border-line px-6 py-16 md:px-16">
        <div className="flex max-w-[280px] flex-1 basis-[260px] flex-col gap-3">
          <div className="text-xl font-semibold">Charaxis</div>
          <p className="font-serif text-[15px] leading-relaxed text-wood">
            Εργαστήριο χαμηλής όχλησης, custom laser χαράξεις σε ξύλο. Κάθε κομμάτι φτιάχνεται ένα-ένα, κατόπιν παραγγελίας.
          </p>
        </div>

        <div className="flex flex-1 basis-[160px] flex-col gap-2.5 text-sm">
          <div className="mb-1 font-medium">Κατάστημα</div>
          <Link href="/kategories/mpreloka" className={link}>Μπρελόκ</Link>
          <Link href="/kategories/xaragmeni-fotografia" className={link}>Χαραγμένη Φωτογραφία</Link>
          <Link href="/kategories/xristougeniatika-stolidia" className={link}>Χριστουγεννιάτικα Στολίδια</Link>
          <Link href="/prosfora" className={link}>Ζήτα Προσφορά</Link>
        </div>

        <div className="flex flex-1 basis-[160px] flex-col gap-2.5 text-sm">
          <div className="mb-1 font-medium">Πληροφορίες</div>
          <Link href="/apostoli-pliromi" className={link}>Αποστολή & πληρωμή</Link>
          <Link href="/epistrofes" className={link}>Επιστροφές & ακυρώσεις</Link>
          <Link href="/faq" className={link}>Συχνές ερωτήσεις</Link>
          <Link href="/oroi-xrhshs" className={link}>Όροι χρήσης</Link>
          <Link href="/aporrito" className={link}>Πολιτική απορρήτου</Link>
        </div>

        <div className="flex flex-1 basis-[200px] flex-col gap-2.5 text-sm">
          <div className="mb-1 font-medium">Επικοινωνία</div>
          <a href={`mailto:${BUSINESS.email}`} className={link}>{BUSINESS.email}</a>
          {BUSINESS.phone && <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className={link}>{BUSINESS.phone}</a>}
          {BUSINESS.instagram && <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className={link}>Instagram</a>}
          {BUSINESS.facebook && <a href={BUSINESS.facebook} target="_blank" rel="noreferrer" className={link}>Facebook</a>}
          <Link href="/epikoinonia" className={link}>Φόρμα επικοινωνίας</Link>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 border-t border-line px-6 py-5 text-center text-[12.5px] text-faint md:px-16">
        <span>© {new Date().getFullYear()} Charaxis. Όλα τα δικαιώματα κατοχυρωμένα.</span>
        {(BUSINESS.legalName || BUSINESS.afm) && (
          <span>{[BUSINESS.legalName, BUSINESS.afm ? `ΑΦΜ ${BUSINESS.afm}` : null, BUSINESS.doy ? `ΔΟΥ ${BUSINESS.doy}` : null].filter(Boolean).join(" · ")}</span>
        )}
      </div>
    </footer>
  );
}
