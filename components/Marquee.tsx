const WORDS = ["Μπρελόκ με όνομα", "Ξύλινα ρολόγια", "Ταμπέλες", "Χριστουγεννιάτικα στολίδια", "Χαραγμένες φωτογραφίες", "Εταιρικά δώρα", "Ενθύμια γέννησης"];

// Κυλιόμενη λωρίδα με ό,τι φτιάχνουμε. Καθαρό CSS, σταματά στο hover.
export default function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="group relative overflow-hidden border-y border-ink bg-ink py-4 text-paper">
      <div className="marquee flex w-max gap-10 group-hover:[animation-play-state:paused]">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap text-[15px] font-semibold uppercase tracking-[0.18em] md:text-[17px]" aria-hidden={i >= WORDS.length}>
            {w}
            <span className="text-ember" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
