import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCustomizer, { type CustomField } from "@/components/ProductCustomizer";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import TrustBadges from "@/components/TrustBadges";
import ShareButton from "@/components/ShareButton";
import DeliveryEstimate from "@/components/DeliveryEstimate";
import RecentlyViewed from "@/components/RecentlyViewed";
import { minPrice, type Pricing } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

type Product = {
  id: string;
  category_id: string | null;
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

type Category = { id: string; name: string; slug: string };

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, category_id, name, slug, description, material, dimensions, base_price, images, is_customizable, custom_fields, pricing"
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

async function getCategory(id: string | null): Promise<Category | null> {
  if (!id) return null;
  try {
    const { data } = await supabase.from("categories").select("id, name, slug").eq("id", id).eq("active", true).maybeSingle();
    return (data as Category) ?? null;
  } catch {
    return null;
  }
}

// Πρώτα προϊόντα της ίδιας κατηγορίας, μετά συμπληρώνουμε με άλλα, ως 4.
async function getRelated(p: Product): Promise<CardProduct[]> {
  try {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, base_price, images, pricing, category_id")
      .eq("active", true)
      .neq("id", p.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(24);
    const all = (data ?? []) as (CardProduct & { category_id: string | null })[];
    const same = all.filter((x) => p.category_id && x.category_id === p.category_id);
    const rest = all.filter((x) => !same.includes(x));
    return [...same, ...rest].slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) return { title: "Προϊόν — Charaxis" };
  const clean = p.description?.replace(/\s+/g, " ").trim();
  const desc = clean ? (clean.length > 158 ? `${clean.slice(0, 155).trimEnd()}…` : clean) : `${p.name}: χειροποίητη laser χάραξη σε ξύλο από το Charaxis.`;
  const img = p.images?.[0];
  return {
    title: `${p.name} — Charaxis`,
    description: desc,
    alternates: { canonical: `/proionta/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: img ? [img] : undefined, url: `/proionta/${p.slug}` },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([getCategory(product.category_id), getRelated(product)]);

  const images = product.images || [];
  const pricing = product.pricing;
  const price = pricing ? minPrice(pricing) : product.base_price ? Number(product.base_price) : null;
  const url = `${SITE_URL}/proionta/${product.slug}`;

  const crumbs = [
    { name: "Αρχική", url: `${SITE_URL}/` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/kategories/${category.slug}` }] : []),
    { name: product.name, url },
  ];

  return (
    <main className="flex flex-col overflow-x-hidden pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description || undefined,
              image: images.length ? images : undefined,
              sku: product.slug,
              material: product.material || undefined,
              category: category?.name,
              brand: { "@type": "Brand", name: "Charaxis" },
              offers: price
                ? {
                    "@type": "Offer",
                    url,
                    priceCurrency: "EUR",
                    price: price.toFixed(2),
                    availability: "https://schema.org/MadeToOrder",
                    itemCondition: "https://schema.org/NewCondition",
                    seller: { "@type": "Organization", name: "Charaxis" },
                  }
                : undefined,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
            },
          ]),
        }}
      />
      <Header />
      <section className="flex flex-col gap-3 px-6 pt-6 text-sm text-wood md:px-16">
        <nav aria-label="Διαδρομή" className="flex flex-wrap items-center gap-y-1">
          <Link href="/" className="transition-colors duration-200 hover:text-ember">
            Αρχική
          </Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/kategories/${category.slug}`} className="transition-colors duration-200 hover:text-ember">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </section>

      <section className="grid grid-cols-1 gap-10 px-6 py-8 md:grid-cols-2 md:gap-14 md:px-16 md:py-12">
        <div className="md:sticky md:top-28 md:self-start">
          <ProductGallery images={images} productName={product.name} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="text-[13px] text-wood">
            {product.material || "Ξύλο"}
            {product.dimensions ? ` · ${product.dimensions}` : ""}
          </div>
          <h1 className="text-[28px] font-medium leading-tight md:text-[34px]">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-2xl font-medium text-ember">
              {price ? `${pricing ? "από " : ""}${price.toFixed(2)} €${pricing ? " / τεμ." : ""}` : ""}
            </div>
            <ShareButton title={product.name} />
          </div>
          {product.description && (
            <p className="max-w-md whitespace-pre-line font-serif text-[15px] leading-relaxed text-wood">
              {product.description}
            </p>
          )}

          <DeliveryEstimate />
          <TrustBadges />

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

          <p className="font-serif text-[14px] text-wood">
            Θες κάτι διαφορετικό;{" "}
            <Link href="/prosfora" className="text-ink underline underline-offset-2 hover:text-ember">
              Ζήτα προσφορά
            </Link>{" "}
            και το σχεδιάζουμε μαζί.
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="flex flex-col gap-8 border-t border-line px-6 py-14 md:px-16 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[24px] font-medium">Μπορεί να σου αρέσουν</h2>
            <Link
              href={category ? `/kategories/${category.slug}` : "/proionta"}
              className="text-sm text-wood transition-colors duration-200 hover:text-ember"
            >
              {category ? `Όλα στην κατηγορία ${category.name}` : "Όλα τα προϊόντα"} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed
        current={{
          slug: product.slug,
          name: product.name,
          image: images[0] ?? null,
          price: price ? `${pricing ? "από " : ""}${price.toFixed(2)} €` : "",
        }}
      />

      <Footer />
    </main>
  );
}
