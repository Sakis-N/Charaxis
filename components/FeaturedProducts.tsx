import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

async function getFeaturedProducts(): Promise<CardProduct[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, base_price, images, pricing")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(8);

    if (error || !data) return [];
    return data as CardProduct[];
  } catch {
    // Αν λείπουν env vars ή αποτύχει το αίτημα (π.χ. κατά το build),
    // δεν σπάμε όλο το build.
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-10 px-6 py-16 md:px-12 md:py-24 lg:px-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Φτιαγμένα για σένα</span>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[44px]">Διάλεξε και πρόσθεσε το όνομά σου</h2>
        </div>
        <Link href="/proionta" className="text-[14px] font-semibold underline-offset-4 hover:text-ember hover:underline">
          Όλα τα προϊόντα →
        </Link>
      </Reveal>
      {/* Κινητό: οριζόντια κύλιση. Desktop: πλέγμα 4 στηλών. */}
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="w-[64%] shrink-0 snap-start sm:w-[42%] md:w-auto">
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
