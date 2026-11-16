"use client";

import { useEffect, useState } from "react";
import { DELIVERY_DAYS, PRODUCTION_DAYS } from "@/lib/business";

// Προσθέτει εργάσιμες (Δευ–Παρ) σε μια ημερομηνία.
function addBusinessDays(from: Date, n: number) {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

const fmt = (d: Date) => d.toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" });

// "Αν παραγγείλεις σήμερα, φτάνει περίπου Πέμ 20 Νοε – Πέμ 27 Νοε".
// Υπολογίζεται στον browser (σωστή "σήμερα" ημερομηνία για τον επισκέπτη).
export default function DeliveryEstimate() {
  const [range, setRange] = useState<[string, string] | null>(null);
  useEffect(() => {
    // Η μέρα της παραγγελίας δεν μετράει· ξεκινάμε από την επόμενη εργάσιμη.
    const start = new Date();
    const min = addBusinessDays(start, PRODUCTION_DAYS[0] + DELIVERY_DAYS[0]);
    const max = addBusinessDays(start, PRODUCTION_DAYS[1] + DELIVERY_DAYS[1]);
    setRange([fmt(min), fmt(max)]);
  }, []);

  if (!range) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#EAE3D3] px-4 py-3.5">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-ember">
        <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="text-[14px] leading-snug">
        Αν παραγγείλεις σήμερα, φτάνει περίπου{" "}
        <span className="font-semibold">
          {range[0]} – {range[1]}
        </span>
        <span className="block text-[12.5px] text-wood">Παραγωγή στο εργαστήριο + αποστολή, σε εργάσιμες ημέρες</span>
      </p>
    </div>
  );
}
