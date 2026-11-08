"use client";

import { useState, type ChangeEvent } from "react";

type Props = {
  beforeSrc?: string;
  afterSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
};

// Σκίτσο μολυβιού: το φόντο με πλακέ χρώμα γίνεται λευκό και μένουν οι
// γραμμές (κλασική μέθοδος: αντιστροφή + θόλωμα + color dodge).
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const k = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / k;
      sum += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / k;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

function sketch(img: HTMLImageElement): string {
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

  const gray = new Float32Array(w * h);
  const inv = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const g = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    gray[i] = g;
    inv[i] = 255 - g;
  }
  const r = Math.max(2, Math.round(Math.max(w, h) / 150));
  const blur = boxBlur(boxBlur(inv, w, h, r), w, h, r);

  const m = Math.round(Math.max(w, h) * 0.05);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = Math.min(255, (gray[i] * 255) / (255 - blur[i] + 1));
      v = Math.pow(v / 255, 1.9) * 255;
      if (v > 235) v = 255;
      if (x < m || y < m || x >= w - m || y >= h - m) v = 255;
      px[i * 4] = v;
      px[i * 4 + 1] = v;
      px[i * 4 + 2] = v;
      px[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeLabel = "Η φωτογραφία σου",
  afterLabel = "Σκίτσο, χωρίς φόντο",
}: Props) {
  const [pos, setPos] = useState(50);
  const [custom, setCustom] = useState<{ before: string; after: string } | null>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setCustom({ before: url, after: sketch(img) });
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
          <div className="absolute inset-0 flex bg-white items-center justify-center font-serif text-[18px] italic text-wood">
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
