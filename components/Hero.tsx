export default function Hero() {
  return (
    <section className="flex flex-wrap items-center gap-10 px-6 py-10 md:gap-16 md:px-16 md:py-24">
      <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-5 md:gap-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent md:text-[13px]">
          Χειροποίητες Laser Χαράξεις
        </div>
        <h1 className="text-[32px] font-medium leading-[1.18] sm:text-[42px] md:text-[52px]">
          Προσωποποιημένα κομμάτια, χαραγμένα σε ξύλο
        </h1>
        <p className="max-w-[480px] text-[15.5px] leading-relaxed text-muted md:text-[17px]">
          Μπρελόκ, χαραγμένες φωτογραφίες και χριστουγεννιάτικα στολίδια,
          φτιαγμένα ένα-ένα στο εργαστήριό μας. Ανέβασε τη φωτογραφία σου,
          πρόσθεσε το δικό σου κείμενο — ή ζήτα κάτι εντελώς διαφορετικό.
        </p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 md:mt-2">
          <button className="rounded-full bg-accent px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/25 sm:py-[15px]">
            Φτιάξε το δικό σου
          </button>
          <button className="rounded-full border-[1.5px] border-ink px-7 py-3.5 text-[15px] font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-ink hover:text-bg sm:py-[15px]">
            Δες τη συλλογή
          </button>
        </div>
      </div>

      <div className="placeholder-tile h-[220px] min-w-0 flex-1 basis-[420px] overflow-hidden rounded-2xl sm:h-[320px] md:h-[440px]">
        <span className="inline-block transition-transform duration-700 ease-out hover:scale-105">
          Φωτογραφία προϊόντος — hero
        </span>
      </div>
    </section>
  );
}
