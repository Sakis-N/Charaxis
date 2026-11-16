import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import { SITE_URL } from "@/lib/site";
import { PRODUCTION_TIME } from "@/lib/business";

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
    const [{ data: products }, { data: others }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, base_price, images, pricing")
        .eq("active", true)
        .eq("category_id", (cat as Category).id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("name, slug").eq("active", true).neq("slug", slug).order("sort_order", { ascending: true }),
    ]);
    return {
      cat: cat as Category,
      products: (products ?? []) as CardProduct[],
      others: (others ?? []) as { name: string; slug: string }[],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getData(params.slug);
  if (!d) return { title: "Κατηγορία" };
  const description = d.cat.description || `${d.cat.name}: χειροποίητες laser χαράξεις σε ξύλο από το Charaxis, με το δικό σου κείμενο ή φωτογραφία.`;
  const img = d.products.find((p) => p.images?.length)?.images?.[0];
  return {
    title: `${d.cat.name} — Charaxis`,
    description,
    alternates: { canonical: `/kategories/${d.cat.slug}` },
    openGraph: { title: `${d.cat.name} — Charaxis`, description, images: img ? [img] : undefined },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const d = await getData(params.slug);
  if (!d) notFound();

  const covers = d.products.filter((p) => p.images?.length).map((p) => p.images![0]).slice(0, 3);

  return (
    <main className="flex flex-col overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Αρχική", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: d.cat.name, item: `${SITE_URL}/kategories/${d.cat.slug}` },
            ],
          }),
        }}
      />
      <Header />

      {/* Banner κατηγορίας */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 flex">
          {covers.map((src, i) => (
            <div key={src + i} className="relative h-full flex-1">
              <Image src={src} alt="" fill sizes="50vw" priority={i === 0} className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/20" />
        <div className="relative flex min-h-[300px] flex-col justify-end gap-4 px-6 pb-10 pt-16 md:min-h-[380px] md:px-12 md:pb-14 lg:px-16">
          <nav aria-label="Διαδρομή" className="text-[13px] text-paper/60">
            <Link href="/" className="hover:text-paper">Αρχική</Link>
            <span className="mx-2">/</span>
            <span className="text-paper">{d.cat.name}</span>
          </nav>
          <h1 className="text-[38px] font-semibold leading-tight tracking-tight md:text-[56px]">{d.cat.name}</h1>
          {d.cat.description && <p className="max-w-xl font-serif text-[17px] leading-relaxed text-paper/75">{d.cat.description}</p>}
          <p className="text-[13px] font-medium text-paper/60">
            {d.products.length} {d.products.length === 1 ? "προϊόν" : "προϊόντα"} · Παραγωγή σε {PRODUCTION_TIME}
          </p>
        </div>
      </section>

      {/* Γρήγορη μετάβαση σε άλλες κατηγορίες */}
      {d.others.length > 0 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto border-b border-line px-6 py-4 md:px-12 lg:px-16">
          <span className="shrink-0 self-center pr-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-wood">Δες και</span>
          {d.others.map((o) => (
            <Link key={o.slug} href={`/kategories/${o.slug}`} className="shrink-0 rounded-full border border-line px-4 py-2 text-[13.5px] transition-colors hover:border-ink">
              {o.name}
            </Link>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-9 px-6 py-12 md:px-12 md:py-16 lg:px-16">
        {d.products.length === 0 ? (
          <p className="font-serif text-wood">
            Τα προϊόντα αυτής της κατηγορίας ανεβαίνουν σύντομα. Στο μεταξύ,{" "}
            <Link href="/prosfora" className="text-ink underline underline-offset-2 hover:text-ember">ζήτα προσφορά</Link>{" "}
            για ό,τι έχεις στο μυαλό σου.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {d.products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}
          </div>
        )}

        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line p-7 md:flex-row md:items-center md:justify-between md:p-9">
          <div className="flex flex-col gap-1.5">
            <span className="text-[19px] font-semibold">Δεν βρήκες ακριβώς αυτό που θες;</span>
            <span className="font-serif text-wood">Πες μας την ιδέα σου και θα σου στείλουμε προσφορά.</span>
          </div>
          <Link href="/prosfora" className="shrink-0 rounded-full bg-ink px-6 py-3.5 text-[14px] font-semibold text-paper transition-colors hover:bg-ember">
            Ζήτα προσφορά
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
