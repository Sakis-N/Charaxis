import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductBrowser, { type BrowserProduct } from "@/components/ProductBrowser";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Όλα τα προϊόντα — Charaxis",
  description:
    "Ξύλινα μπρελόκ με όνομα, χαραγμένες φωτογραφίες, ρολόγια, ταμπέλες και στολίδια με laser χάραξη. Φτιαγμένα ένα-ένα, με το δικό σου κείμενο ή φωτογραφία.",
  alternates: { canonical: "/proionta" },
};

async function getData() {
  try {
    const [prods, cats] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, base_price, images, pricing, category_id")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order", { ascending: true }),
    ]);
    return {
      products: (prods.data ?? []) as BrowserProduct[],
      categories: (cats.data ?? []) as { id: string; name: string; slug: string }[],
    };
  } catch {
    return { products: [], categories: [] };
  }
}

export default async function ProductsPage() {
  const { products, categories } = await getData();

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex flex-col gap-8 px-6 py-12 md:px-16 md:py-16">
        <div className="flex flex-col gap-3">
          <h1 className="text-[28px] font-medium md:text-[34px]">Όλα τα προϊόντα</h1>
          <p className="max-w-xl font-serif text-wood">
            Κάθε κομμάτι χαράζεται με laser στο εργαστήριό μας, με το δικό σου κείμενο ή τη δική σου φωτογραφία.
          </p>
        </div>

        {products.length === 0 ? (
          <p className="font-serif text-wood">
            Σύντομα εδώ — ή{" "}
            <Link href="/prosfora" className="text-ink underline underline-offset-2 hover:text-ember">
              ζήτα προσφορά
            </Link>{" "}
            για κάτι συγκεκριμένο.
          </p>
        ) : (
          <ProductBrowser products={products} categories={categories} />
        )}
      </section>
      <Footer />
    </main>
  );
}
