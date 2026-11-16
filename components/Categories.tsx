import Image from "next/image";
import Link from "next/link";
import { getActiveCategories } from "@/lib/categories";
import Reveal from "@/components/Reveal";

// Κατηγορίες σε "bento" πλέγμα: η πρώτη μεγάλη, οι υπόλοιπες γύρω της.
export default async function Categories() {
  const categories = await getActiveCategories();
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="flex scroll-mt-24 flex-col gap-10 px-6 py-16 md:px-12 md:py-24 lg:px-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Η συλλογή</span>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[44px]">Τι θα χαράξουμε για σένα;</h2>
        </div>
        <Link href="/proionta" className="text-[14px] font-semibold underline-offset-4 hover:text-ember hover:underline">
          Όλα τα προϊόντα →
        </Link>
      </Reveal>

      <div className="grid auto-rows-[200px] grid-cols-2 gap-3 md:auto-rows-[240px] md:grid-cols-4 md:gap-5">
        {categories.map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/kategories/${cat.slug}`}
            className={`group relative overflow-hidden rounded-xl bg-line/50 ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            {cat.cover ? (
              <Image
                src={cat.cover}
                alt={cat.name}
                fill
                sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            ) : (
              <div className="placeholder-tile h-full" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent transition-opacity duration-300 group-hover:from-ink/90" />
            <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 md:inset-x-6 md:bottom-6">
              <span className="flex flex-col gap-1">
                <span className={`font-semibold leading-tight text-paper ${i === 0 ? "text-[24px] md:text-[34px]" : "text-[16px] md:text-[20px]"}`}>
                  {cat.name}
                </span>
                {cat.count > 0 && (
                  <span className="text-[12.5px] text-paper/75">
                    {cat.count} {cat.count === 1 ? "προϊόν" : "προϊόντα"}
                  </span>
                )}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-all duration-300 group-hover:bg-ember group-hover:text-paper md:h-11 md:w-11">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
