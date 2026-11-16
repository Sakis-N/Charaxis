import Reveal from "@/components/Reveal";
import { PRODUCTION_TIME } from "@/lib/business";

const steps = [
  {
    n: "01",
    title: "Διαλέγεις",
    text: "Ένα προϊόν από τη συλλογή, ή μας περιγράφεις κάτι εντελώς δικό σου.",
  },
  {
    n: "02",
    title: "Το κάνεις δικό σου",
    text: "Γράφεις όνομα, ημερομηνία ή ανεβάζεις φωτογραφία, και βλέπεις αμέσως την προεπισκόπηση.",
  },
  {
    n: "03",
    title: "Το χαράζουμε",
    text: `Στήνουμε το σχέδιο και το χαράζουμε με laser στο εργαστήριο, σε ${PRODUCTION_TIME}.`,
  },
  {
    n: "04",
    title: "Το παραλαμβάνεις",
    text: "Με ACS στην πόρτα σου ή σε θυρίδα BoxNow. Βλέπεις την πορεία της παραγγελίας σου online.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-ink px-6 py-20 text-paper md:px-12 md:py-28 lg:px-16">
      {/* λεπτή "ακτίνα λέιζερ" που διασχίζει την ενότητα */}
      <span className="laser-sweep pointer-events-none absolute left-0 top-[46%] h-px w-full" aria-hidden="true" />
      <Reveal className="relative mb-14 flex max-w-2xl flex-col gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Από το εργαστήριο</span>
        <h2 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[44px]">Από την ιδέα σου, στα χέρια σου.</h2>
      </Reveal>
      <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 110} className="flex flex-col gap-4 border-t border-paper/15 pt-6">
            <span className="font-serif text-[48px] italic leading-none text-ember md:text-[56px]">{s.n}</span>
            <h3 className="text-[20px] font-semibold">{s.title}</h3>
            <p className="max-w-[300px] font-serif text-[15.5px] leading-relaxed text-paper/65">{s.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
