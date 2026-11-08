import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCustomizer, { type CustomField } from "@/components/ProductCustomizer";
import ProductGallery from "@/components/ProductGallery";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  base_price: string | null;
  images: string[] | null;
  is_customizable: boolean;
  custom_fields: CustomField[] | null;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, material, dimensions, base_price, images, is_customizable, custom_fields"
      )
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) return null;
    return data as Product;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const images = product.images || [];
  const price = product.base_price ? Number(product.base_price) : null;

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex flex-col gap-3 px-6 pt-6 text-sm text-wood md:px-16">
        <nav>
          <Link href="/" className="transition-colors duration-200 hover:text-ember">
            Αρχική
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </section>

      <section className="grid grid-cols-1 gap-10 px-6 py-8 md:grid-cols-2 md:gap-14 md:px-16 md:py-12">
        <ProductGallery images={images} productName={product.name} />

        <div className="flex flex-col gap-5">
          <div className="text-[13px] text-wood">
            {product.material || "Ξύλο"}
            {product.dimensions ? ` · ${product.dimensions}` : ""}
          </div>
          <h1 className="text-[28px] font-medium leading-tight md:text-[34px]">
            {product.name}
          </h1>
          <div className="text-2xl font-medium text-ember">
            {price ? `${price.toFixed(2)} €` : "[ΤΙΜΗ]"}
          </div>
          {product.description && (
            <p className="max-w-md font-serif text-[15px] leading-relaxed text-wood">
              {product.description}
            </p>
          )}

          {product.is_customizable ? (
            <ProductCustomizer
              productName={product.name}
              basePrice={price}
              fields={product.custom_fields || []}
            />
          ) : (
            <button className="w-fit bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember">
              Προσθήκη στο καλάθι
            </button>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
