// Κλιμακωτή τιμολόγηση ανά ποσότητα (π.χ. μπρελόκ για καταστήματα).
// Η τελική τιμή υπολογίζεται ΠΑΝΤΑ στη βάση (συνάρτηση product_unit_price)·
// ό,τι δείχνει ο browser είναι ενδεικτικό και ακολουθεί τον ίδιο κανόνα.

export type Pricing = {
  // Ελάχιστη ποσότητα κάθε κλιμακίου, αύξουσα, η πρώτη = 1. Π.χ. [1, 3, 10, 25, 50, 100]
  min_qty: number[];
  // Κάθε "variant" έχει μία τιμή ανά τεμάχιο για κάθε κλιμάκιο.
  variants: Record<string, { label: string; prices: number[] }>;
  // Η χαμηλότερη τιμή (για εμφάνιση "από … €" στις λίστες).
  min_price?: number;
};

export type Tiers = [number, number][]; // [ελάχιστη ποσότητα, τιμή ανά τεμάχιο]

export const SIDE_CHOICES = [
  { value: "logo", label: "Λογότυπο" },
  { value: "text", label: "Γράμματα" },
  { value: "none", label: "Χωρίς χάραξη" },
] as const;

// Κλειδί τιμολόγησης από τις επιλογές των όψεων. Η σειρά των όψεων δεν παίζει ρόλο
// (λογότυπο μπροστά + γράμματα πίσω κοστίζει όσο και το αντίστροφο).
// Παραδείγματα: ["logo","logo"] → "logo_logo", ["text","logo"] → "logo_text",
// ["none","text"] → "text", ["none","none"] → null (δεν υπάρχει τιμή).
export function variantKey(choices: string[]): string | null {
  const used = choices.filter((c) => c === "logo" || c === "text").sort();
  return used.length ? used.join("_") : null;
}

export function tiersFor(p: Pricing | null | undefined, variant: string | null): Tiers | null {
  if (!p || !variant) return null;
  const v = p.variants?.[variant];
  if (!v) return null;
  return p.min_qty.map((m, i) => [Number(m), Number(v.prices[i])] as [number, number]);
}

export function tierPrice(tiers: Tiers, qty: number): number {
  let price = tiers[0][1];
  for (const [min, pr] of tiers) if (qty >= min) price = pr;
  return price;
}

export function minPrice(p: Pricing): number {
  const all = Object.values(p.variants).flatMap((v) => v.prices.map(Number));
  return all.length ? Math.min(...all) : 0;
}

export function rangeLabel(tiers: Tiers, i: number): string {
  const min = tiers[i][0];
  const next = tiers[i + 1]?.[0];
  if (next === undefined) return `${min}+ τεμ.`;
  return next - 1 === min ? `${min} τεμ.` : `${min}–${next - 1} τεμ.`;
}

// Κείμενο τιμής για κάρτες/λίστες: "από 0.55 € / τεμ." για κλιμακωτά, αλλιώς η σταθερή τιμή.
export function listPrice(basePrice: string | number | null | undefined, pricing?: Pricing | null): string {
  if (pricing) return `από ${minPrice(pricing).toFixed(2)} € / τεμ.`;
  return basePrice ? `${Number(basePrice).toFixed(2)} €` : "";
}
