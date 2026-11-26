"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { moveJobToDate } from "@/app/actions";

export function DropDay({ date, children, className = "" }: { date: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div
      className={`${className} ${pending ? "opacity-50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("ring-2", "ring-brand-500");
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove("ring-2", "ring-brand-500")}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("ring-2", "ring-brand-500");
        const id = Number(e.dataTransfer.getData("text/job"));
        if (id) start(async () => {
          await moveJobToDate(id, date);
          router.refresh();
        });
      }}
    >
      {children}
    </div>
  );
}

export function DragJob({ id, children, className = "", style }: { id: number; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const router = useRouter();
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/job", String(id))}
      onClick={() => router.push(`/jobs/${id}`)}
      className={`cursor-pointer ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
