export default function Hero() {
  return (
    <section className="flex flex-wrap items-center gap-16 px-6 py-16 md:px-16 md:py-24">
      <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-6">
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          Χειροποίητες Laser Χαράξεις
        </div>
        <h1 className="text-[42px] font-medium leading-tight md:text-[52px]">
          Προσωποποιημένα κομμάτια, χαραγμένα σε ξύλο
        </h1>
        <p className="max-w-[480px] text-[17px] leading-relaxed text-muted">
          Μπρελόκ, χαραγμένες φωτογραφίες και χριστουγεννιάτικα στολίδια,
          φτιαγμένα ένα-ένα στο εργαστήριό μας. Ανέβασε τη φωτογραφία σου,
          πρόσθεσε το δικό σου κείμενο — ή ζήτα κάτι εντελώς διαφορετικό.
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <button className="rounded-full bg-accent px-7 py-[15px] text-[15px] font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/25">
            Φτιάξε το δικό σου
          </button>
          <button className="rounded-full border-[1.5px] border-ink px-7 py-[15px] text-[15px] font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-ink hover:text-bg">
            Δες τη συλλογή
          </button>
        </div>
      </div>

      <div className="placeholder-tile h-[320px] min-w-0 flex-1 basis-[420px] overflow-hidden rounded-2xl md:h-[440px]">
        <span className="inline-block transition-transform duration-700 ease-out hover:scale-105">
          Φωτογραφία προϊόντος — hero
        </span>
      </div>
    </section>
  );
}
