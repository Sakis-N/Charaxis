import EngraveMark from "@/components/icons/EngraveMark";
import LaserPanel from "@/components/LaserPanel";
import PanelDoodles from "@/components/PanelDoodles";

export default function Hero() {
  return (
    <section className="flex flex-wrap items-center gap-10 px-6 py-14 md:gap-16 md:px-16 md:py-24">
      <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-6">
        <h1 className="text-[34px] font-medium leading-[1.14] sm:text-[44px] md:text-[56px]">
          Προσωποποιημένα κομμάτια,
          <br />
          χαραγμένα σε ξύλο
        </h1>
        <p className="max-w-[460px] font-serif text-[17px] leading-relaxed text-wood md:text-[18px]">
          Μπρελόκ, χαραγμένες φωτογραφίες και χριστουγεννιάτικα στολίδια,
          φτιαγμένα ένα-ένα στο εργαστήριό μας. Ανέβασε τη φωτογραφία σου,
          πρόσθεσε το δικό σου κείμενο — ή ζήτα κάτι εντελώς διαφορετικό.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-7">
          <a
            href="/proionta"
            className="bg-ink px-7 py-3.5 text-[15px] font-medium text-paper transition-colors duration-200 hover:bg-ember"
          >
            Φτιάξε το δικό σου
          </a>
          <a
            href="#categories"
            className="relative py-1 text-[15px] font-medium after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-ink after:transition-colors after:duration-200 hover:after:bg-ember"
          >
            Δες τη συλλογή
          </a>
        </div>
      </div>

      <LaserPanel>
        <PanelDoodles />
        <EngraveMark />
      </LaserPanel>
    </section>
  );
}
