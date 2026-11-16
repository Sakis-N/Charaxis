import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ProductCard, { type CardProduct } from "@/components/ProductCard";

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
    <section className="flex flex-col gap-9 border-t border-line px-6 py-16 md:px-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[26px] font-medium">Δημοφιλή</h2>
        <Link href="/proionta" className="text-sm text-wood transition-colors duration-200 hover:text-ember">
          Δες όλα τα προϊόντα →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
