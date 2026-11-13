import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { type CardProduct } from "@/components/ProductCard";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

type Category = { id: string; name: string; slug: string; description: string | null };

async function getData(slug: string) {
  try {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (!cat) return null;
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, base_price, images, pricing")
      .eq("active", true)
      .eq("category_id", (cat as Category).id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    return { cat: cat as Category, products: (products ?? []) as CardProduct[] };
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
          <span className="text-ink">{d.cat.name}</span>
        </nav>
      </section>
      <section className="flex flex-col gap-9 px-6 py-10 md:px-16 md:py-14">
        <div className="flex flex-col gap-3">
          <h1 className="text-[28px] font-medium md:text-[34px]">{d.cat.name}</h1>
          {d.cat.description && <p className="max-w-xl font-serif text-wood">{d.cat.description}</p>}
        </div>
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
