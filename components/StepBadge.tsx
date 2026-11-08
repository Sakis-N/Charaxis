"use client";

import { useEffect, useRef, useState } from "react";

// Ο κύκλος του βήματος "χαράσσεται" μία φορά όταν φτάνει στο οπτικό πεδίο.
export default function StepBadge({ n }: { n: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative flex h-11 w-11 items-center justify-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r="21"
          fill="none"
          stroke="#1B1714"
          strokeWidth="1"
          pathLength={1}
          strokeDasharray="1"
          style={{
            strokeDashoffset: seen ? 0 : 1,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
      </svg>
      <span
        className="text-base"
        style={{
          opacity: seen ? 1 : 0,
          transition: "opacity 0.5s ease-out 0.6s",
        }}
      >
        {n}
      </span>
    </div>
  );
}
