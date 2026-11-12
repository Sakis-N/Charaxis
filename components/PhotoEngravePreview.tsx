"use client";

import { useState, type CSSProperties } from "react";

// Περιοχή χάραξης πάνω στη φωτογραφία, σε % της εικόνας (0–100).
export type PreviewArea = {
  x: number;
  y: number;
  w: number;
  h: number;
  tone?: "dark" | "light"; // σκούρη χάραξη σε ξύλο / ανοιχτή σε μαύρο plexiglass
};

// Η φωτογραφία του προϊόντος με το κείμενο του πελάτη να "χαράσσεται"
// ακριβώς στο σημείο που ορίζει ο διαχειριστής.
export default function PhotoEngravePreview({
  image,
  area,
  lines,
}: {
  image: string;
  area: PreviewArea;
  lines: string[];
}) {
  const [ratio, setRatio] = useState(1); // πλάτος / ύψος εικόνας
  const light = area.tone === "light";
  const n = Math.max(lines.length, 1);
  const longest = Math.max(1, ...lines.map((l) => Array.from(l).length));

  // Μεγέθη σε cqw (% πλάτους της εικόνας). Το ύψος της περιοχής σε cqw = h/ratio.
  const areaHcqw = area.h / ratio;
  const byHeight = (areaHcqw / n) * 0.78;
  const byWidth = (area.w / longest) * 1.75;
  const fontCqw = Math.max(1.2, Math.min(byHeight, byWidth, 9));

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm border border-line"
      style={{ containerType: "inline-size" }}
      aria-live="polite"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="Προεπισκόπηση χάραξης"
        className="block h-auto w-full"
        onLoad={(e) => {
          const im = e.currentTarget;
          if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
        }}
      />
      <div
        className="pointer-events-none absolute flex flex-col items-center justify-center text-center"
        style={{
          left: `${area.x}%`,
          top: `${area.y}%`,
          width: `${area.w}%`,
          height: `${area.h}%`,
          fontSize: `${fontCqw}cqw`,
          lineHeight: 1.18,
          mixBlendMode: light ? "screen" : "multiply",
          opacity: light ? 0.92 : 0.88,
          ["--burn-final" as string]: light ? "#e6e6e6" : "#3a2110",
        } as CSSProperties}
      >
        {lines.map((line, li) => (
          <div key={li} className="max-w-full whitespace-pre-wrap break-words font-serif">
            {Array.from(line).map((ch, i) => (
              <span key={i} className="burn-char">
                {ch}
              </span>
            ))}
          </div>
        ))}
      </div>
      {lines.length === 0 && (
        <div className="absolute inset-x-0 bottom-0 bg-ink/55 px-3 py-2 text-center font-serif text-sm italic text-white">
          Γράψε κάτι παρακάτω και δες το να χαράσσεται πάνω στο προϊόν
        </div>
      )}
    </div>
  );
}
