import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  slug: string;
  material: string | null;
  base_price: string | null;
  images: string[] | null;
};

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, material, base_price, images")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    // Αν λείπουν env vars ή αποτύχει το αίτημα (π.χ. κατά το build),
    // πέφτουμε πίσω σε placeholders αντί να σπάσει όλο το build.
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="flex flex-col gap-9 border-t border-line px-6 py-16 md:px-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[26px] font-medium">Δημοφιλή</h2>
        <Link href="/proionta" className="text-sm text-wood transition-colors duration-200 hover:text-ember">
          Δες όλα τα προϊόντα
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => {
          const img = p.images && p.images.length > 0 ? p.images[0] : null;
          return (
            <Link key={p.id} href={`/proionta/${p.slug}`} className="group flex flex-col gap-2.5">
              <div className="relative h-[200px] overflow-hidden rounded-sm border border-line after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-ember after:transition-transform after:duration-500 group-hover:after:scale-x-100">
                {img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="placeholder-tile h-full">
                    <span className="inline-block">Φωτογραφία προϊόντος</span>
                  </div>
                )}
              </div>
              <h3 className="text-[15px] font-medium leading-snug transition-colors duration-200 group-hover:text-ember">
                {p.name}
              </h3>
              <div className="text-[15px] text-wood">
                {p.base_price ? `${Number(p.base_price).toFixed(2)} €` : ""}
              </div>
            </Link>
          );
        })}

      </div>
    </section>
  );
}
