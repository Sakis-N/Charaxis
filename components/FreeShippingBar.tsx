"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Το όριο δωρεάν μεταφορικών έρχεται από τη βάση (ρύθμιση στο admin),
// μία φορά ανά επίσκεψη. null = δεν υπάρχουν δωρεάν μεταφορικά.
let cached: Promise<number | null> | null = null;
export function getFreeShippingFrom() {
  if (!cached) {
    cached = Promise.resolve(supabase.rpc("free_shipping_from"))
      .then(({ data }) => (data == null ? null : Number(data) || null))
      .catch(() => null);
  }
  return cached;
}

export function useFreeShippingFrom() {
  const [v, setV] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    getFreeShippingFrom().then((x) => alive && setV(x));
    return () => {
      alive = false;
    };
  }, []);
  return v;
}

const euro = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

// Μπάρα προόδου: «Σου λείπουν 12,50 € για δωρεάν μεταφορικά».
export default function FreeShippingBar({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const from = useFreeShippingFrom();
  if (!from) return null;
  const left = Math.max(0, from - amount);
  const pct = Math.min(100, (amount / from) * 100);
  const done = left <= 0.0001;

  return (
    <div className={`flex flex-col gap-2 rounded-xl ${done ? "bg-[#E3E6D3]" : "bg-[#F3E9D6]"} ${compact ? "px-3.5 py-3" : "px-4 py-3.5"}`}>
      <p className="text-[13.5px] leading-snug">
        {done ? (
          <>
            🎉 <b>Έχεις δωρεάν μεταφορικά!</b>
          </>
        ) : (
          <>
            🚚 Σου λείπουν <b className="text-ember">{euro(left)}</b> για <b>δωρεάν μεταφορικά</b>
          </>
        )}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-paper/80" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${done ? "bg-[#6B7D3A]" : "bg-ember"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!done && !compact && <p className="text-[11.5px] text-wood">Δωρεάν αποστολή για παραγγελίες από {euro(from)}.</p>}
    </div>
  );
}
