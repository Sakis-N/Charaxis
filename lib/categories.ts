import { supabase } from "@/lib/supabase/client";

export type NavCategory = { name: string; slug: string };

// Οι ενεργές κατηγορίες με τη σειρά που έχουν στο admin.
// Αν η βάση δεν απαντήσει, επιστρέφουμε κενή λίστα ώστε η σελίδα να μη σπάσει.
export async function getActiveCategories(): Promise<NavCategory[]> {
  try {
    const { data } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as NavCategory[];
  } catch {
    return [];
  }
}
