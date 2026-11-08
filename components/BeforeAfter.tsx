"use client";

import { useState } from "react";

type Props = {
  beforeSrc?: string;
  afterSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
};

// Slider "πριν / μετά". Χωρίς εικόνες δείχνει placeholders, ώστε να φαίνεται
// η λειτουργία μέχρι να μπουν πραγματικά ζευγάρια φωτογραφιών.
export default function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeLabel = "Η φωτογραφία σου",
  afterLabel = "Χαραγμένο σε ξύλο",
}: Props) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-sm border border-line">
      {/* ΜΕΤΑ (κάτω στρώμα) */}
      {afterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="wood-panel absolute inset-0 flex items-center justify-center font-serif text-[18px] italic text-wood">
          {afterLabel}
        </div>
      )}

      {/* ΠΡΙΝ (πάνω στρώμα, κόβεται από δεξιά) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {beforeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={beforeSrc} alt={beforeLabel} className="h-full w-full object-cover" />
        ) : (
          <div className="placeholder-tile h-full w-full">{beforeLabel}</div>
        )}
      </div>

      {/* Διαχωριστική γραμμή */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-ember"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ember bg-paper" />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 bg-paper/90 px-2 py-1 text-xs">Πριν</span>
      <span className="pointer-events-none absolute right-3 top-3 bg-paper/90 px-2 py-1 text-xs">Μετά</span>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Σύρε για σύγκριση πριν και μετά"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
