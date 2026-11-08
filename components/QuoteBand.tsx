import Link from "next/link";

export default function QuoteBand() {
  return (
    <section className="flex flex-col items-start gap-5 bg-ink px-6 py-16 text-paper md:px-16">
      <h2 className="max-w-[560px] text-[26px] font-medium leading-snug">
        Έχεις στο μυαλό σου κάτι που δεν βλέπεις εδώ;
      </h2>
      <p className="max-w-[560px] font-serif text-[17px] leading-relaxed text-paper/70">
        Ρολόγια, επιγραφές, εταιρικά δώρα, χάραξη σε μαχαίρια και ό,τι άλλο φανταστείς. Πες μας την ιδέα σου και θα σου στείλουμε προσφορά.
      </p>
      <Link
        href="/prosfora"
        className="border border-paper px-7 py-3 text-sm font-medium transition-colors duration-200 hover:border-ember hover:bg-ember"
      >
        Ζήτα προσφορά
      </Link>
    </section>
  );
}
