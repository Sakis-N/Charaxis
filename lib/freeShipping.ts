import { supabase } from "@/lib/supabase/client";

// Όριο δωρεάν μεταφορικών για σελίδες που φτιάχνονται στον server.
// null = δεν υπάρχουν δωρεάν μεταφορικά (ή η βάση δεν απάντησε).
export async function freeShippingFrom(): Promise<number | null> {
  try {
    const { data } = await supabase.rpc("free_shipping_from");
    return data == null ? null : Number(data) || null;
  } catch {
    return null;
  }
}

export const euroShort = (n: number) => (n % 1 ? n.toFixed(2).replace(".", ",") : String(n)) + " €";
