import BeforeAfter from "@/components/BeforeAfter";

export default function EngraveShowcase() {
  return (
    <section className="grid grid-cols-1 items-center gap-10 border-t border-line px-6 py-14 md:grid-cols-2 md:gap-16 md:px-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h2 className="text-[26px] font-medium">Από τη φωτογραφία σου, στο ξύλο</h2>
        <p className="max-w-[420px] font-serif text-[17px] leading-relaxed text-wood">
          Στέλνεις μια φωτογραφία και την ξαναφτιάχνουμε με λέιζερ σε ξύλο.
          Σύρε το slider για να δεις τη διαφορά.
        </p>
      </div>
      <BeforeAfter />
    </section>
  );
}
