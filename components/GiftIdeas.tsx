import Link from "next/link";
import Reveal from "@/components/Reveal";

// Ιδέες δώρου ανά περίσταση: ο πελάτης ψάχνει "δώρο για…", όχι "κατηγορία".
const IDEAS = [
  {
    emoji: "💛",
    title: "Για ζευγάρια",
    text: "Μπρελόκ με αρχικά και την ημερομηνία σας. Για επέτειο, Αγίου Βαλεντίνου ή «έτσι».",
    href: "/kategories/mpreloka",
    tone: "from-[#F6DCCB] to-[#EFC7AE]",
  },
  {
    emoji: "👶",
    title: "Για νέο μωρό",
    text: "Ενθύμιο με όνομα, ώρα, βάρος και ύψος γέννησης. Το δώρο που κρατιέται μια ζωή.",
    href: "/kategories/xaragmeni-fotografia",
    tone: "from-[#E3E6D3] to-[#CFD5B6]",
  },
  {
    emoji: "🎄",
    title: "Για τα Χριστούγεννα",
    text: "Στολίδια με όνομα και «τα πρώτα μου Χριστούγεννα». Μικρά, προσωπικά δωράκια.",
    href: "/kategories/xristougeniatika-stolidia",
    tone: "from-[#EAD9C6] to-[#DCC2A5]",
  },
  {
    emoji: "🏪",
    title: "Για επιχειρήσεις",
    text: "Ρολόι ή ταμπέλα με το λογότυπό σου, μπρελόκ σε ποσότητες με κλιμακωτή τιμή.",
    href: "/kategories/rologia",
    tone: "from-[#DCD8D0] to-[#C9C2B6]",
  },
];

export default function GiftIdeas() {
  return (
    <section id="idees-dorou" className="flex scroll-mt-24 flex-col gap-10 bg-[#EAE3D3] px-6 py-16 md:px-12 md:py-24 lg:px-16">
      <Reveal className="flex max-w-2xl flex-col gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Ιδέες δώρου</span>
        <h2 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[44px]">Ψάχνεις δώρο; Ξεκίνα από την περίσταση.</h2>
      </Reveal>
      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {IDEAS.map((idea, i) => (
          <Reveal key={idea.title} delay={i * 90} className="w-[78%] shrink-0 snap-start md:w-auto">
            <Link
              href={idea.href}
              className={`group flex h-full min-h-[250px] flex-col justify-between gap-6 rounded-xl bg-gradient-to-br ${idea.tone} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(27,23,20,0.5)]`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper/80 text-[26px] shadow-sm" aria-hidden="true">
                {idea.emoji}
              </span>
              <span className="flex flex-col gap-2">
                <span className="text-[21px] font-semibold">{idea.title}</span>
                <span className="font-serif text-[15px] leading-relaxed text-ink/70">{idea.text}</span>
                <span className="mt-2 text-[13.5px] font-semibold transition-colors group-hover:text-ember">Δες ιδέες →</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
