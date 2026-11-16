import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import LiveEngrave from "@/components/LiveEngrave";
import { PRODUCTION_TIME } from "@/lib/business";

// Δύο πραγματικές φωτογραφίες προϊόντων για τα "πολαρόιντ" γύρω από την πλακέτα.
async function getPhotos(): Promise<{ src: string; name: string; slug: string }[]> {
  try {
    const { data } = await supabase
      .from("products")
      .select("name, slug, images")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(12);
    return ((data ?? []) as { name: string; slug: string; images: string[] | null }[])
      .filter((p) => p.images && p.images.length > 0)
      .slice(0, 2)
      .map((p) => ({ src: p.images![0], name: p.name, slug: p.slug }));
  } catch {
    return [];
  }
}

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-ember">
    <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default async function Hero() {
  const photos = await getPhotos();

  return (
    <section className="relative overflow-hidden">
      {/* απαλή "λάμψη λέιζερ" στο φόντο */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(226,67,15,0.16) 0%, rgba(226,67,15,0) 70%)" }}
        aria-hidden="true"
      />
      <div className="relative grid grid-cols-1 items-center gap-12 px-6 pb-16 pt-10 md:px-12 md:pb-24 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-16">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="flex w-fit items-center gap-2 rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-wood">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
            Laser χάραξη σε ξύλο
          </span>
          <h1 className="text-[36px] font-semibold leading-[1.08] tracking-tight sm:text-[52px] lg:text-[66px]">
            Δώρα με{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 font-serif font-normal italic text-ember">το δικό σου</span>
              <svg viewBox="0 0 300 20" className="absolute -bottom-1 left-0 z-0 h-3 w-full md:-bottom-2 md:h-4" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 14 C 80 4, 200 4, 296 12" fill="none" stroke="#E2430F" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" className="engrave-path" />
              </svg>
            </span>
            <br />
            όνομα, χαραγμένο για πάντα.
          </h1>
          <p className="max-w-[500px] font-serif text-[17px] leading-relaxed text-wood md:text-[19px]">
            Μπρελόκ, ρολόγια, ταμπέλες, στολίδια και χαραγμένες φωτογραφίες. Φτιάχνουμε κάθε κομμάτι ένα-ένα στο εργαστήριό μας, με το κείμενο ή τη φωτογραφία που διαλέγεις εσύ.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              href="/proionta"
              className="rounded-full bg-ink px-7 py-4 text-[15px] font-semibold text-paper shadow-[0_10px_24px_-12px_rgba(27,23,20,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-ember"
            >
              Δες τα προϊόντα
            </Link>
            <Link
              href="/#idees-dorou"
              className="rounded-full border border-ink/20 px-7 py-4 text-[15px] font-semibold transition-colors duration-200 hover:border-ink"
            >
              Ιδέες δώρου
            </Link>
          </div>
          <ul className="mt-2 flex flex-col gap-2 text-[14px] text-ink/80 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <li className="flex items-center gap-2"><Check /> Το δικό σου κείμενο ή φωτογραφία</li>
            <li className="flex items-center gap-2"><Check /> Παραγωγή σε {PRODUCTION_TIME}</li>
            <li className="flex items-center gap-2"><Check /> Αποστολή σε όλη την Ελλάδα</li>
          </ul>
        </div>

        <div className="relative">
          {photos[0] && (
            <Link
              href={`/proionta/${photos[0].slug}`}
              className="absolute -left-4 top-[38%] z-10 hidden w-[124px] -rotate-6 rounded-md bg-white p-2 pb-6 shadow-xl transition-transform duration-300 hover:-rotate-2 hover:scale-105 lg:block xl:-left-12"
              aria-label={photos[0].name}
            >
              <span className="relative block aspect-square overflow-hidden rounded-sm">
                <Image src={photos[0].src} alt={photos[0].name} fill sizes="132px" className="object-cover" />
              </span>
            </Link>
          )}
          {photos[1] && (
            <Link
              href={`/proionta/${photos[1].slug}`}
              className="absolute -right-2 -top-10 z-10 hidden w-[116px] rotate-[7deg] rounded-md bg-white p-2 pb-6 shadow-xl transition-transform duration-300 hover:rotate-2 hover:scale-105 lg:block xl:-right-4"
              aria-label={photos[1].name}
            >
              <span className="relative block aspect-square overflow-hidden rounded-sm">
                <Image src={photos[1].src} alt={photos[1].name} fill sizes="120px" className="object-cover" />
              </span>
            </Link>
          )}
          <LiveEngrave />
        </div>
      </div>
    </section>
  );
}
