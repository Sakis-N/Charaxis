const steps = [
  {
    n: 1,
    title: "Διάλεξε προϊόν",
    text: "Μπρελόκ, χαραγμένη φωτογραφία ή στολίδι — όλα χαραγμένα σε ξύλο.",
  },
  {
    n: 2,
    title: "Προσαρμόσε το σχέδιο",
    text: "Βάλε όνομα, ημερομηνία ή τη δική σου εικόνα, μπροστά και πίσω.",
  },
  {
    n: 3,
    title: "Χάραξη & παραλαβή",
    text: "Το χαράσσουμε στο εργαστήριο και σου το στέλνουμε με courier της επιλογής σου.",
  },
];

export default function HowItWorks() {
  return (
    <section className="flex flex-col gap-10 px-6 py-14 md:px-16 md:pb-24">
      <h2 className="text-[26px] font-medium">Πώς δουλεύει</h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:divide-x md:divide-line">
        {steps.map((step) => (
          <div key={step.n} className="flex flex-col gap-3.5 md:px-8 md:first:pl-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink text-base transition-colors duration-200 group-hover:border-ember">
              {step.n}
            </div>
            <h3 className="text-[17px] font-semibold">{step.title}</h3>
            <p className="max-w-[260px] font-serif text-[15px] leading-relaxed text-wood">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
