"use client";

import { useMemo, useState } from "react";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import { minPrice } from "@/lib/pricing";

export type BrowserProduct = CardProduct & { category_id: string | null };
type Cat = { id: string; name: string; slug: string };

const SORTS = [
  { v: "default", label: "Προτεινόμενα" },
  { v: "price_asc", label: "Τιμή: χαμηλή → υψηλή" },
  { v: "price_desc", label: "Τιμή: υψηλή → χαμηλή" },
] as const;

const priceOf = (p: BrowserProduct) => (p.pricing ? minPrice(p.pricing) : Number(p.base_price) || 0);

// Φίλτρο κατηγορίας + ταξινόμηση, όλα στον browser (λίγα προϊόντα → άμεσο).
export default function ProductBrowser({ products, categories }: { products: BrowserProduct[]; categories: Cat[] }) {
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]["v"]>("default");

  const visibleCats = categories.filter((c) => products.some((p) => p.category_id === c.id));

  const list = useMemo(() => {
    const filtered = cat ? products.filter((p) => p.category_id === cat) : products;
    if (sort === "default") return filtered;
    const s = [...filtered].sort((a, b) => priceOf(a) - priceOf(b));
    return sort === "price_desc" ? s.reverse() : s;
  }, [products, cat, sort]);

  const chip = (active: boolean) =>
    `shrink-0 border px-4 py-2 text-[13.5px] transition-colors duration-200 ${
      active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
    }`;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="-mx-6 flex gap-2.5 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Κατηγορίες">
          <button type="button" onClick={() => setCat(null)} className={chip(cat === null)} aria-pressed={cat === null}>
            Όλα ({products.length})
          </button>
          {visibleCats.map((c) => {
            const n = products.filter((p) => p.category_id === c.id).length;
            return (
              <button key={c.id} type="button" onClick={() => setCat(c.id)} className={chip(cat === c.id)} aria-pressed={cat === c.id}>
                {c.name} ({n})
              </button>
            );
          })}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-wood">
          Ταξινόμηση
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p, i) => (
          <ProductCard key={p.id} p={p} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
