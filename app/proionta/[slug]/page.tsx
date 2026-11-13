import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCustomizer, { type CustomField } from "@/components/ProductCustomizer";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import { minPrice, type Pricing } from "@/lib/pricing";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

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
  pricing: Pricing | null;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, material, dimensions, base_price, images, is_customizable, custom_fields, pricing"
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) return { title: "Προϊόν — Charaxis" };
  const desc = p.description?.slice(0, 160) || `${p.name} — χειροποίητη laser χάραξη σε ξύλο από το Charaxis.`;
  const img = p.images?.[0];
  return {
    title: `${p.name} — Charaxis`,
    description: desc,
    openGraph: { title: p.name, description: desc, images: img ? [img] : undefined },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const images = product.images || [];
  const pricing = product.pricing;
  const price = pricing ? minPrice(pricing) : product.base_price ? Number(product.base_price) : null;

  return (
    <main className="flex flex-col overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description || undefined,
            image: images.length ? images : undefined,
            brand: { "@type": "Brand", name: "Charaxis" },
            offers: price
              ? { "@type": "Offer", priceCurrency: "EUR", price: price.toFixed(2), availability: "https://schema.org/InStock" }
              : undefined,
          }),
        }}
      />
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
            {price ? `${pricing ? "από " : ""}${price.toFixed(2)} €${pricing ? " / τεμ." : ""}` : ""}
          </div>
          {product.description && (
            <p className="max-w-md font-serif text-[15px] leading-relaxed text-wood">
              {product.description}
            </p>
          )}

          {product.is_customizable ? (
            <ProductCustomizer
              productId={product.id}
              slug={product.slug}
              image={images[0] ?? null}
              productName={product.name}
              basePrice={price}
              fields={product.custom_fields || []}
              pricing={pricing}
            />
          ) : (
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              image={images[0] ?? null}
              price={price ?? 0}
            />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
