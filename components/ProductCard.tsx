import Image from "next/image";
import Link from "next/link";
import { listPrice, type Pricing } from "@/lib/pricing";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  base_price: string | null;
  images: string[] | null;
  pricing?: Pricing | null;
};

// Κάρτα προϊόντος για όλες τις λίστες. Αν υπάρχει δεύτερη φωτογραφία,
// εμφανίζεται στο hover (desktop).
export default function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const img = p.images && p.images.length > 0 ? p.images[0] : null;
  const alt = p.images && p.images.length > 1 ? p.images[1] : null;
  return (
    <Link href={`/proionta/${p.slug}`} className="group flex flex-col gap-2.5">
      <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-line/40 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-ember after:transition-transform after:duration-500 group-hover:after:scale-x-100">
        {img ? (
          <>
            <Image
              src={img}
              alt={p.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={`object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] ${alt ? "md:group-hover:opacity-0" : ""}`}
            />
            {alt && (
              <Image
                src={alt}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="hidden object-cover opacity-0 transition-opacity duration-500 ease-out md:block md:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="placeholder-tile h-full">
            <span className="inline-block">Φωτογραφία προϊόντος</span>
          </div>
        )}
      </div>
      <h3 className="text-[15px] font-medium leading-snug transition-colors duration-200 group-hover:text-ember">{p.name}</h3>
      <div className="text-[15px] text-wood">{listPrice(p.base_price, p.pricing)}</div>
    </Link>
  );
}
