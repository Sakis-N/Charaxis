import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Product = {
  id: string;
  name: string;
  slug: string;
  material: string | null;
  base_price: string | null;
  images: string[] | null;
};

async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, material, base_price, images")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex flex-col gap-9 px-6 py-12 md:px-16 md:py-16">
        <h1 className="font-display text-[28px] font-medium md:text-[34px]">
          Όλα τα προϊόντα
        </h1>

        {products.length === 0 ? (
          <p className="text-muted">
            Σύντομα εδώ — ή{" "}
            <a href="#quote" className="text-accent underline underline-offset-2">
              ζήτα προσφορά
            </a>{" "}
            για κάτι συγκεκριμένο.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {products.map((p) => {
              const img = p.images && p.images.length > 0 ? p.images[0] : null;
              return (
                <Link
                  key={p.id}
                  href={`/proionta/${p.slug}`}
                  className="group flex flex-col gap-2.5"
                >
                  <div className="relative h-[200px] overflow-hidden rounded-xl bg-border/40 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="placeholder-tile h-full">
                        <span className="inline-block">Φωτογραφία προϊόντος</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                    {p.material || "Ξύλο"}
                  </div>
                  <h3 className="text-[15px] font-semibold leading-snug transition-colors duration-200 group-hover:text-accent">
                    {p.name}
                  </h3>
                  <div className="text-[15px] font-semibold text-accent">
                    {p.base_price ? `${Number(p.base_price).toFixed(2)} €` : "[ΤΙΜΗ]"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
