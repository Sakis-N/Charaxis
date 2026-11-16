"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DEMOS = ["Μαρία & Νίκος", "Καλή χρονιά!", "Για τη γιαγιά ♥", "Θανάσης", "19 · 07 · 2025"];

// Το "παιχνίδι" του hero: ο επισκέπτης γράφει κάτι και το βλέπει να
// χαράζεται ζωντανά σε ξύλινη πλακέτα. Μέχρι να γράψει, η πλακέτα
// "γράφει" μόνη της μερικά παραδείγματα.
export default function LiveEngrave() {
  const [text, setText] = useState("");
  const [user, setUser] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pulse() {
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 600);
  }

  // Αυτόματη πληκτρολόγηση παραδειγμάτων μέχρι να γράψει ο χρήστης.
  useEffect(() => {
    if (user) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(DEMOS[0]);
      return;
    }
    let demo = 0;
    let pos = 0;
    let erasing = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = DEMOS[demo];
      if (!erasing) {
        pos++;
        setText(word.slice(0, pos));
        pulse();
        if (pos >= word.length) {
          erasing = true;
          t = setTimeout(tick, 2200);
          return;
        }
        t = setTimeout(tick, 110 + Math.random() * 90);
      } else {
        pos = 0;
        setText("");
        erasing = false;
        demo = (demo + 1) % DEMOS.length;
        t = setTimeout(tick, 500);
      }
    };
    t = setTimeout(tick, 900);
    return () => clearTimeout(t);
  }, [user]);

  const chars = Array.from(text);
  const size = chars.length > 18 ? "text-[26px] md:text-[34px]" : chars.length > 11 ? "text-[32px] md:text-[42px]" : "text-[40px] md:text-[54px]";

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Η πλακέτα */}
      <div className="relative mx-auto w-full max-w-[520px]">
        <div
          className="wood-panel relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(58,36,20,0.55),inset_0_0_0_1px_rgba(58,36,20,0.12),inset_0_-14px_30px_-10px_rgba(58,36,20,0.18)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(92deg, rgba(58,36,20,0.045) 0 2px, transparent 2px 14px), repeating-linear-gradient(88deg, rgba(58,36,20,0.03) 0 1px, transparent 1px 37px), linear-gradient(160deg, #EBDDBF 0%, #D9C29A 55%, #CDB287 100%)",
          }}
        >
          {/* τρύπα ανάρτησης */}
          <span className="absolute left-6 top-6 h-5 w-5 rounded-full bg-paper shadow-[inset_0_2px_4px_rgba(58,36,20,0.45)]" aria-hidden="true" />
          {/* χαραγμένο περίγραμμα */}
          <span className="pointer-events-none absolute inset-4 rounded-[20px] border border-[#3A2414]/25" aria-hidden="true" />

          <p
            className={`relative px-10 text-center font-serif italic leading-tight ${size}`}
            style={{ color: "#3A2414", ["--burn-final" as string]: "#3A2414", textShadow: "0 1px 0 rgba(255,240,210,0.35)" }}
            aria-live="polite"
          >
            {chars.length === 0 ? (
              <span className="opacity-0">.</span>
            ) : (
              chars.map((ch, i) => (
                <span key={i} className="burn-char">
                  {ch === " " ? " " : ch}
                </span>
              ))
            )}
            {/* κεφαλή λέιζερ */}
            <span
              className={`ml-1 inline-block h-[0.55em] w-[0.55em] -translate-y-[0.1em] rounded-full align-middle transition-opacity duration-200 ${
                typing ? "opacity-100" : "opacity-0"
              }`}
              style={{ background: "#ff7a2f", boxShadow: "0 0 10px 4px rgba(226,67,15,0.85), 0 0 26px 10px rgba(255,122,47,0.35)" }}
              aria-hidden="true"
            />
          </p>
        </div>
      </div>

      {/* Το πεδίο */}
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-2">
        <label htmlFor="try-engrave" className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-wood">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" aria-hidden="true" />
          Δοκίμασε: γράψε ένα όνομα
        </label>
        <div className="flex items-stretch gap-2">
          <input
            id="try-engrave"
            type="text"
            maxLength={28}
            value={user ? text : ""}
            placeholder={user ? "" : "π.χ. το όνομά σου"}
            onFocus={() => {
              if (!user) {
                setUser(true);
                setText("");
              }
            }}
            onChange={(e) => {
              setUser(true);
              setText(e.target.value);
              pulse();
            }}
            className="min-w-0 flex-1 rounded-full border border-line bg-paper px-5 py-3 text-[16px] outline-none transition-colors focus:border-ink"
          />
          <Link
            href="/proionta"
            className="flex shrink-0 items-center rounded-full bg-ink px-5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-ember"
          >
            Φτιάξ&apos; το →
          </Link>
        </div>
      </div>
    </div>
  );
}
