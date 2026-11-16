import Link from "next/link";
import Reveal from "@/components/Reveal";
import { BUSINESS, PRODUCTION_TIME } from "@/lib/business";

const FAQ = [
  {
    q: "Πόσο γρήγορα θα το έχω;",
    a: `Κάθε κομμάτι φτιάχνεται κατόπιν παραγγελίας σε ${PRODUCTION_TIME}. Μετά φεύγει με το μεταφορικό που διαλέγεις και φτάνει συνήθως σε 1–4 εργάσιμες.`,
  },
  {
    q: "Μπορώ να στείλω τη δική μου φωτογραφία ή λογότυπο;",
    a: "Ναι. Την ανεβάζεις κατευθείαν στη σελίδα του προϊόντος. Αν χρειαστεί κάποια προσαρμογή για να βγει τέλεια η χάραξη, επικοινωνούμε μαζί σου.",
  },
  {
    q: "Θα δω το σχέδιο πριν χαραχτεί;",
    a: "Στη σελίδα του προϊόντος βλέπεις ζωντανή προεπισκόπηση όσο γράφεις. Αν κάτι χρειάζεται διευκρίνιση, επικοινωνούμε μαζί σου πριν τη χάραξη.",
  },
  {
    q: "Φτιάχνετε και κάτι που δεν υπάρχει στο site;",
    a: "Φυσικά. Ζήτα προσφορά με την ιδέα σου (ακόμα και μια φωτογραφία ή ένα σκίτσο) και σου απαντάμε με τιμή.",
  },
];

// Συχνές ερωτήσεις + κάλεσμα για προσφορά, δίπλα-δίπλα.
export default function QuoteBand() {
  return (
    <section className="grid grid-cols-1 gap-12 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-16">
      <Reveal className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Συχνές ερωτήσεις</span>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[40px]">Καλές ερωτήσεις.</h2>
        </div>
        <div className="flex flex-col border-t border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16.5px] font-semibold transition-colors hover:text-ember [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-open:rotate-45 group-open:border-ember group-open:bg-ember group-open:text-paper" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="max-w-xl pb-5 font-serif text-[15.5px] leading-relaxed text-wood">{f.a}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="text-[14px] font-semibold hover:text-ember">
          Όλες οι ερωτήσεις →
        </Link>
      </Reveal>

      <Reveal delay={120}>
        <div className="relative flex h-full min-h-[360px] flex-col justify-between gap-8 overflow-hidden rounded-2xl bg-ink p-8 text-paper md:p-10">
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(226,67,15,0.45) 0%, rgba(226,67,15,0) 70%)" }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-4">
            <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Κάτι μοναδικό</span>
            <h3 className="text-[28px] font-semibold leading-tight md:text-[34px]">Έχεις μια ιδέα που δεν βλέπεις εδώ;</h3>
            <p className="max-w-md font-serif text-[16.5px] leading-relaxed text-paper/70">
              Επιγραφές, εταιρικά δώρα, χάραξη σε μαχαίρια, δώρα για γάμους και βαπτίσεις. Πες μας τι σκέφτεσαι και σου στέλνουμε προσφορά.
            </p>
          </div>
          <div className="relative flex flex-wrap items-center gap-4">
            <Link href="/prosfora" className="rounded-full bg-ember px-7 py-4 text-[15px] font-semibold text-paper transition-colors hover:bg-ember-dark">
              Ζήτα προσφορά
            </Link>
            <a href={`mailto:${BUSINESS.email}`} className="text-[14px] text-paper/70 hover:text-paper">
              ή γράψε μας: {BUSINESS.email}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
