"use client";

import { useEffect, useRef, useState } from "react";

// "Στείλ' το σε κάποιον": στο κινητό ανοίγει το μενού κοινοποίησης του
// τηλεφώνου, στον υπολογιστή μικρό μενού με αντιγραφή / Viber / WhatsApp / Facebook.
export default function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function url() {
    return window.location.href.split("?")[0];
  }

  async function onClick() {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && typeof navigator.share === "function") {
      navigator.share({ title, text: `${title} — Charaxis`, url: url() }).catch(() => {});
      return;
    }
    setOpen((v) => !v);
  }

  const item = "block w-full px-4 py-2.5 text-left text-[13.5px] transition-colors hover:bg-line/50";
  const text = () => encodeURIComponent(`${title}: ${url()}`);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold transition-colors hover:border-ink"
        aria-expanded={open}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Στείλ&apos; το σε κάποιον
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-xl">
          <button
            type="button"
            className={item}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url());
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                  setOpen(false);
                }, 1200);
              } catch {}
            }}
          >
            {copied ? "Αντιγράφηκε ✓" : "Αντιγραφή συνδέσμου"}
          </button>
          <a className={item} href={`viber://forward?text=${text()}`}>Viber</a>
          <a className={item} href={`https://wa.me/?text=${text()}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className={item} href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== "undefined" ? encodeURIComponent(url()) : ""}`} target="_blank" rel="noreferrer">
            Facebook
          </a>
        </div>
      )}
    </div>
  );
}
