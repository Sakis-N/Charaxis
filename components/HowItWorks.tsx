const steps = [
  {
    n: 1,
    title: "Διάλεξε προϊόν",
    text: "Μπρελόκ, art print ή διακοσμητικό — όλα σε 3mm κόντρα πλακέ σημύδας.",
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
    <section className="flex flex-col gap-11 px-6 py-14 md:px-16 md:pb-24">
      <h2 className="text-center text-[28px] font-medium">Πώς δουλεύει</h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.n}
            className="flex flex-col items-center gap-3.5 text-center"
          >
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-accent bg-white font-display text-xl text-accent">
              {step.n}
            </div>
            <h3 className="text-[17px] font-semibold">{step.title}</h3>
            <p className="max-w-[240px] text-[14.5px] leading-relaxed text-muted">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
