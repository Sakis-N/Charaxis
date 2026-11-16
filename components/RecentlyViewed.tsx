"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Seen = { slug: string; name: string; image: string | null; price: string };
const KEY = "charaxis_seen_v1";

// Καταγράφει το προϊόν που βλέπει ο επισκέπτης και δείχνει τα προηγούμενα
// που είχε δει (μόνο σε αυτή τη συσκευή).
export default function RecentlyViewed({ current }: { current: Seen }) {
  const [list, setList] = useState<Seen[]>([]);

  useEffect(() => {
    let prev: Seen[] = [];
    try {
      prev = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(prev)) prev = [];
    } catch {}
    setList(prev.filter((s) => s.slug !== current.slug).slice(0, 6));
    try {
      const next = [current, ...prev.filter((s) => s.slug !== current.slug)].slice(0, 12);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [current]);

  if (list.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 border-t border-line px-6 py-12 md:px-12 lg:px-16">
      <h2 className="text-[20px] font-semibold">Είδες πρόσφατα</h2>
      <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 md:mx-0 md:px-0">
        {list.map((s) => (
          <Link key={s.slug} href={`/proionta/${s.slug}`} className="group flex w-[150px] shrink-0 flex-col gap-2 md:w-[170px]">
            <span className="relative aspect-square overflow-hidden rounded-md border border-line bg-line/40">
              {s.image && <Image src={s.image} alt={s.name} fill sizes="170px" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
            </span>
            <span className="line-clamp-2 text-[13.5px] font-medium leading-snug group-hover:text-ember">{s.name}</span>
            <span className="text-[13px] text-wood">{s.price}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
