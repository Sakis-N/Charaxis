"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

type Mark = { id: number; x: number; y: number };

// Το πάνελ του hero: όπου περνάς το ποντίκι (ή το δάχτυλο) το "λέιζερ"
// καίει ένα σημάδι που πρώτα λάμπει πορτοκαλί, μετά μαυρίζει και σβήνει.
export default function LaserPanel({ children }: { children: ReactNode }) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const nextId = useRef(0);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (last.current && Math.hypot(x - last.current.x, y - last.current.y) < 9) return;
    last.current = { x, y };

    const id = nextId.current++;
    setMarks((m) => [...m.slice(-70), { id, x, y }]);
    setTimeout(() => setMarks((m) => m.filter((mk) => mk.id !== id)), 5000);
  }

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => {
        last.current = null;
      }}
      className="wood-panel group relative flex min-w-0 flex-1 basis-[420px] cursor-crosshair items-center justify-center overflow-hidden rounded-sm"
      style={{ aspectRatio: "4 / 3" }}
    >
      {marks.map((m) => (
        <span
          key={m.id}
          className="laser-mark pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: m.x, top: m.y }}
        />
      ))}
      {children}
    </div>
  );
}
