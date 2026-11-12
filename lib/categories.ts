import { supabase } from "@/lib/supabase/client";

export type Cat = { id: string; name: string; slug: string; description: string | null; parent_id: string | null; sort_order: number };

// Ενεργές κατηγορίες (με parent_id για υποκατηγορίες).
export async function getActiveCategories(): Promise<Cat[]> {
  try {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, parent_id, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as Cat[];
  } catch {
    return [];
  }
}

// Τα ids μιας κατηγορίας και όλων των απογόνων της.
export function descendantIds(all: Cat[], id: string): string[] {
  const out = [id];
  for (const c of all) if (c.parent_id === id) out.push(...descendantIds(all, c.id));
  return out;
}
