import Image from "next/image";
import { getActiveCategories } from "@/lib/categories";

export default async function Categories() {
  const categories = await getActiveCategories();
  return (
    <section id="categories" className="flex flex-col gap-9 px-6 py-14 md:px-16 md:py-24">
      <h2 className="text-[26px] font-medium">Κατηγορίες</h2>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <a key={cat.slug} href={`/kategories/${cat.slug}`} className="group flex flex-col gap-3.5">
            <div className="placeholder-tile relative h-[220px] overflow-hidden rounded-sm after:absolute after:bottom-0 after:left-0 after:z-10 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-ember after:transition-transform after:duration-500 group-hover:after:scale-x-100">
              {cat.cover ? (
                <Image
                  src={cat.cover}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="inline-block">{cat.name}</span>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <h3 className="text-[15px] font-medium transition-colors duration-200 group-hover:text-ember">
                {cat.name}
              </h3>
              <span className="text-[13px] text-wood">
                {cat.count > 0 ? `${cat.count} ${cat.count === 1 ? "προϊόν" : "προϊόντα"}` : "Δες προϊόντα"}
              </span>
            </div>
          </a>
        ))}

        <a
          id="quote"
          href="/prosfora"
          className="group flex h-[220px] flex-col items-center justify-center gap-3 border border-dashed border-line p-6 text-center transition-colors duration-200 hover:border-ember"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="transition-colors duration-200"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="text-wood transition-colors duration-200 group-hover:text-ember"
            />
          </svg>
          <h3 className="text-[15px] font-medium">Κάτι άλλο;</h3>
          <p className="max-w-[200px] font-serif text-[13.5px] leading-relaxed text-wood">
            Ρολόγια, φωτιστικά, επιγραφές, χάραξη σε μαχαίρια και ό,τι άλλο
            φανταστείς — ζήτα προσφορά.
          </p>
        </a>
      </div>
    </section>
  );
}
