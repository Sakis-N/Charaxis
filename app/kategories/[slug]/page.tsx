import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import { getActiveCategories, descendantIds, type Cat } from "@/lib/categories";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

async function getData(slug: string) {
  try {
    const all = await getActiveCategories();
    const cat = all.find((c) => c.slug === slug);
    if (!cat) return null;
    const ids = descendantIds(all, cat.id); // η κατηγορία + όλες οι υποκατηγορίες της
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, base_price, images")
      .eq("active", true)
      .in("category_id", ids)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    const parent = cat.parent_id ? all.find((c) => c.id === cat.parent_id) ?? null : null;
    const children = all.filter((c) => c.parent_id === cat.id);
    return { cat, parent, children, products: (products ?? []) as CardProduct[] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getData(params.slug);
  if (!d) return { title: "Κατηγορία" };
  return {
    title: `${d.cat.name} — Charaxis`,
    description: d.cat.description || `${d.cat.name}: χειροποίητες laser χαράξεις σε ξύλο από το Charaxis.`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const d = await getData(params.slug);
  if (!d) notFound();

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex flex-col gap-3 px-6 pt-6 text-sm text-wood md:px-16">
        <nav>
          <Link href="/" className="transition-colors duration-200 hover:text-ember">Αρχική</Link>
          <span className="mx-2">/</span>
          {d.parent && (
            <>
              <Link href={`/kategories/${d.parent.slug}`} className="transition-colors duration-200 hover:text-ember">{d.parent.name}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-ink">{d.cat.name}</span>
        </nav>
      </section>
      <section className="flex flex-col gap-9 px-6 py-10 md:px-16 md:py-14">
        <div className="flex flex-col gap-3">
          <h1 className="text-[28px] font-medium md:text-[34px]">{d.cat.name}</h1>
          {d.cat.description && <p className="max-w-xl font-serif text-wood">{d.cat.description}</p>}
        </div>
        {d.children.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {d.children.map((c: Cat) => (
              <Link
                key={c.id}
                href={`/kategories/${c.slug}`}
                className="border border-ink px-5 py-2.5 text-sm font-medium transition-colors duration-200 hover:border-ember hover:text-ember"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
        {d.products.length === 0 ? (
          <p className="font-serif text-wood">
            Τα προϊόντα αυτής της κατηγορίας ανεβαίνουν σύντομα. Στο μεταξύ,{" "}
            <Link href="/prosfora" className="text-ink underline underline-offset-2 hover:text-ember">ζήτα προσφορά</Link>{" "}
            για ό,τι έχεις στο μυαλό σου.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {d.products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
