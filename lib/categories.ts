import { supabase } from "@/lib/supabase/client";

export type NavCategory = {
  name: string;
  slug: string;
  cover: string | null; // φωτογραφία του πρώτου προϊόντος της κατηγορίας
  count: number; // ενεργά προϊόντα
};

// Οι ενεργές κατηγορίες με τη σειρά που έχουν στο admin, μαζί με φωτογραφία
// εξωφύλλου και πλήθος προϊόντων. Αν η βάση δεν απαντήσει, επιστρέφουμε κενή
// λίστα ώστε η σελίδα να μη σπάσει.
export async function getActiveCategories(): Promise<NavCategory[]> {
  try {
    const [cats, prods] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("category_id, images")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);
    const products = (prods.data ?? []) as { category_id: string | null; images: string[] | null }[];
    return ((cats.data ?? []) as { id: string; name: string; slug: string }[]).map((c) => {
      const mine = products.filter((p) => p.category_id === c.id);
      const withImg = mine.find((p) => p.images && p.images.length > 0);
      return {
        name: c.name,
        slug: c.slug,
        cover: withImg?.images?.[0] ?? null,
        count: mine.length,
      };
    });
  } catch {
    return [];
  }
}
