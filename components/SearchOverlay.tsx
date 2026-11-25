"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { listPrice, type Pricing } from "@/lib/pricing";
import { salePercent } from "@/lib/sale";

type Item = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: string | null;
  images: string[] | null;
  pricing: Pricing | null;
  category: string;
};

type Cat = { name: string; slug: string };

const SUGGESTIONS = ["μπρελόκ", "ρολόι", "μωρό", "Χριστούγεννα", "φωτογραφία", "ταμπέλα", "λογότυπο"];

// Ελληνικά χωρίς τόνους/διαλυτικά, πεζά, τελικό σίγμα = σ.
export function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .trim();
}

// Κάποιοι ψάχνουν με λατινικά ("mprelok", "roloi"): απλή αντιστοίχιση.
const LATIN: Record<string, string> = { th: "θ", ch: "χ", ps: "ψ", ks: "ξ", a: "α", b: "μπ", g: "γ", d: "δ", e: "ε", z: "ζ", h: "η", i: "ι", k: "κ", l: "λ", m: "μ", n: "ν", x: "ξ", o: "ο", p: "π", r: "ρ", s: "σ", t: "τ", y: "υ", u: "ου", f: "φ", v: "β", w: "ω", c: "κ", q: "κ", j: "τζ" };
function greeklish(s: string) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (LATIN[two]) {
      out += LATIN[two];
      i++;
    } else out += LATIN[s[i]] ?? s[i];
  }
  return out;
}

let cache: { items: Item[]; cats: Cat[] } | null = null;

async function loadIndex() {
  if (cache) return cache;
  const [p, c] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, description, base_price, images, pricing, category_id")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order", { ascending: true }),
  ]);
  const cats = (c.data ?? []) as { id: string; name: string; slug: string }[];
  const items = ((p.data ?? []) as (Omit<Item, "category"> & { category_id: string | null })[]).map((x) => ({
    ...x,
    category: cats.find((k) => k.id === x.category_id)?.name ?? "",
  }));
  cache = { items, cats: cats.map(({ name, slug }) => ({ name, slug })) };
  return cache;
}

// Αναζήτηση προϊόντων: ανοίγει από το εικονίδιο στο header ή με Ctrl/⌘+K.
export default function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ items: Item[]; cats: Cat[] } | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(0);
  }, []);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("search:open", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("search:open", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setData).catch(() => setData({ items: [], cats: [] }));
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const results = useMemo(() => {
    if (!data) return { items: [] as Item[], cats: [] as Cat[] };
    const raw = norm(q);
    if (!raw) return { items: data.items.slice(0, 6), cats: [] };
    const tokens = raw.split(/\s+/).filter(Boolean);
    const alt = tokens.map((t) => (/[a-z]/.test(t) ? greeklish(t) : t));
    const score = (it: Item) => {
      const name = norm(it.name);
      const hay = `${name} ${norm(it.category)} ${norm(it.description ?? "")}`;
      let s = 0;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const a = alt[i];
        // Ταίριασμα και με "ρίζα" (π.χ. "ρολογια" → "ρολο") για πληθυντικούς.
        const stem = (w: string) => (w.length > 5 ? w.slice(0, w.length - 2) : w);
        const hit = (w: string) => (name.includes(w) ? 3 : hay.includes(w) ? 1 : 0);
        const best = Math.max(hit(t), hit(a), hit(stem(t)), hit(stem(a)));
        if (best === 0) return 0;
        s += best;
      }
      return s;
    };
    const items = data.items
      .map((it) => ({ it, s: score(it) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .map((x) => x.it);
    const cats = data.cats.filter((c) => tokens.some((t, i) => norm(c.name).includes(t) || norm(c.name).includes(alt[i])));
    return { items, cats };
  }, [data, q]);

  useEffect(() => setActive(0), [q]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.items.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter" && results.items[active]) {
      router.push(`/proionta/${results.items[active].slug}`);
      close();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center bg-ink/50 px-3 pt-[8vh] backdrop-blur-sm md:pt-[12vh]" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Αναζήτηση"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-wood">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Τι ψάχνεις; π.χ. μπρελόκ, ρολόι, δώρο για μωρό"
            className="min-w-0 flex-1 bg-transparent py-5 text-[17px] outline-none placeholder:text-faint"
            aria-label="Αναζήτηση προϊόντων"
          />
          <button type="button" onClick={close} className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-wood hover:border-ink">
            ESC
          </button>
        </div>

        <div className="overflow-y-auto p-3">
          {!q && (
            <div className="flex flex-wrap gap-2 px-2 pb-3 pt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] transition-colors hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          )}

          {results.cats.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pb-3">
              {results.cats.map((c) => (
                <Link key={c.slug} href={`/kategories/${c.slug}`} onClick={close} className="rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-paper hover:bg-ember">
                  Κατηγορία: {c.name} →
                </Link>
              ))}
            </div>
          )}

          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-wood">
            {q ? (results.items.length ? `${results.items.length} αποτελέσματα` : "") : "Προτεινόμενα"}
          </div>

          {data === null ? (
            <p className="px-2 py-6 text-sm text-wood">Φόρτωση…</p>
          ) : q && results.items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-2 py-6">
              <p className="font-serif text-wood">Δεν βρήκαμε κάτι για «{q}». Μπορούμε όμως να το φτιάξουμε!</p>
              <Link href="/prosfora" onClick={close} className="rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-ember">
                Ζήτα προσφορά
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col">
              {results.items.map((it, i) => (
                <li key={it.id}>
                  <Link
                    href={`/proionta/${it.slug}`}
                    onClick={close}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors ${i === active ? "bg-line/50" : ""}`}
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-line/50">
                      {it.images?.[0] && <Image src={it.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-medium">{it.name}</span>
                      <span className="text-[12.5px] text-wood">{it.category}</span>
                    </span>
                    <span className="shrink-0 text-right text-[14px] font-semibold text-ember">
                      {listPrice(it.base_price, it.pricing)}
                      {salePercent() > 0 && (it.base_price || it.pricing) && (
                        <s className="block text-[11.5px] font-normal text-faint">{listPrice(it.base_price, it.pricing, { original: true }).replace(/^από /, "")}</s>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="hidden items-center justify-between border-t border-line px-5 py-2.5 text-[11.5px] text-faint md:flex">
          <span>↑↓ για επιλογή · Enter για άνοιγμα</span>
          <span>Ctrl + K από οπουδήποτε</span>
        </div>
      </div>
    </div>
  );
}
