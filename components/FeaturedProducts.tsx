import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  material: string | null;
  base_price: string | null;
  images: string[] | null;
};

// Placeholders για τις θέσεις που δεν έχουν ακόμα πραγματικό προϊόν στη βάση.
const placeholders = [
  { name: "Μπρελόκ με όνομα & ημερομηνία", material: "Ξύλο" },
  { name: "Χαραγμένη φωτογραφία ζευγαριού", material: "Ξύλο" },
  { name: "Μπρελόκ ζευγαριού (μισό-μισό)", material: "Ξύλο" },
  { name: "Χριστουγεννιάτικο στολίδι με φωτογραφία", material: "Ξύλο" },
];

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, material, base_price, images")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    // Αν λείπουν env vars ή αποτύχει το αίτημα (π.χ. κατά το build),
    // πέφτουμε πίσω σε placeholders αντί να σπάσει όλο το build.
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();
  const slotsLeft = Math.max(0, 4 - products.length);

  return (
    <section className="flex flex-col gap-9 px-6 py-16 md:px-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[28px] font-medium">Δημοφιλή</h2>
        <a
          href="/proionta"
          className="group flex items-center text-sm font-semibold text-accent"
        >
          Δες όλα τα προϊόντα
          <span className="ml-1 inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => {
          const img = p.images && p.images.length > 0 ? p.images[0] : null;
          return (
            <div key={p.id} className="group flex flex-col gap-2.5">
              <div className="relative h-[200px] overflow-hidden rounded-xl bg-border/40 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
                {img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="placeholder-tile h-full">
                    <span className="inline-block">Φωτογραφία προϊόντος</span>
                  </div>
                )}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                {p.material || "Ξύλο"}
              </div>
              <h3 className="text-[15px] font-semibold leading-snug transition-colors duration-200 group-hover:text-accent">
                {p.name}
              </h3>
              <div className="text-[15px] font-semibold text-accent">
                {p.base_price ? `${Number(p.base_price).toFixed(2)} €` : "[ΤΙΜΗ]"}
              </div>
            </div>
          );
        })}

        {placeholders.slice(0, slotsLeft).map((p) => (
          <div key={p.name} className="group flex flex-col gap-2.5">
            <div className="placeholder-tile h-[200px] overflow-hidden rounded-xl transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
              <span className="inline-block transition-transform duration-500 ease-out group-hover:scale-110">
                Φωτογραφία προϊόντος
              </span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {p.material}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug transition-colors duration-200 group-hover:text-accent">
              {p.name}
            </h3>
            <div className="text-[15px] font-semibold text-accent">[ΤΙΜΗ]</div>
          </div>
        ))}
      </div>
    </section>
  );
}
