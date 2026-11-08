"use client";

import { useState, type ChangeEvent } from "react";

type Props = {
  beforeSrc?: string;
  afterSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
};

// Μετατρέπει τη φωτογραφία σε "χαραγμένη σε ξύλο": ασπρόμαυρο με αντίθεση,
// όπου τα σκούρα σημεία γίνονται καμένο καφέ πάνω σε ανοιχτό ξύλο.
function engrave(img: HTMLImageElement): string {
  const max = 900;
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s));
  const h = Math.max(1, Math.round(img.height * s));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    let v = (lum - 0.5) * 1.55 + 0.5;
    v = Math.min(1, Math.max(0, v));
    const burn = 1 - Math.pow(v, 1.1);
    px[i] = 224 + (52 - 224) * burn;
    px[i + 1] = 203 + (30 - 203) * burn;
    px[i + 2] = 162 + (14 - 162) * burn;
    px[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export default function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeLabel = "Η φωτογραφία σου",
  afterLabel = "Χαραγμένο σε ξύλο",
}: Props) {
  const [pos, setPos] = useState(50);
  const [custom, setCustom] = useState<{ before: string; after: string } | null>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setCustom({ before: url, after: engrave(img) });
      setPos(50);
    };
    img.src = url;
  }

  const before = custom?.before ?? beforeSrc;
  const after = custom?.after ?? afterSrc;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-sm border border-line">
        {/* ΜΕΤΑ (κάτω στρώμα) */}
        {after ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={after} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="wood-panel absolute inset-0 flex items-center justify-center font-serif text-[18px] italic text-wood">
            {afterLabel}
          </div>
        )}

        {/* ΠΡΙΝ (πάνω στρώμα, κόβεται από δεξιά) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {before ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={before} alt={beforeLabel} className="h-full w-full object-cover" />
          ) : (
            <div className="placeholder-tile h-full w-full">{beforeLabel}</div>
          )}
        </div>

        {/* Διαχωριστική γραμμή */}
        <div className="pointer-events-none absolute inset-y-0 w-px bg-ember" style={{ left: `${pos}%` }}>
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

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="cursor-pointer border border-ink px-5 py-2.5 font-medium transition-colors duration-200 hover:border-ember hover:text-ember">
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          {custom ? "Δοκίμασε άλλη φωτογραφία" : "Δοκίμασε τη δική σου φωτογραφία"}
        </label>
        {custom && (
          <button
            type="button"
            onClick={() => setCustom(null)}
            className="text-wood underline underline-offset-2 hover:text-ember"
          >
            Επαναφορά
          </button>
        )}
        <span className="text-xs text-faint">Η φωτογραφία δεν ανεβαίνει πουθενά, μένει στη συσκευή σου.</span>
      </div>
    </div>
  );
}
