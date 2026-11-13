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

export default function ProductCard({ p }: { p: CardProduct }) {
  const img = p.images && p.images.length > 0 ? p.images[0] : null;
  return (
    <Link href={`/proionta/${p.slug}`} className="group flex flex-col gap-2.5">
      <div className="relative h-[200px] overflow-hidden rounded-sm border border-line after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-ember after:transition-transform after:duration-500 group-hover:after:scale-x-100">
        {img ? (
          <Image src={img} alt={p.name} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
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
