"use client";

import { useEffect, useRef, useState } from "react";
import { btn, inputCls } from "./ui";

/** Canvas υπογραφής: γράφει το PNG (data URL) σε hidden input "signature". */
export function SignaturePad({ action, defaultName = "", id }: { action: (fd: FormData) => void | Promise<void>; defaultName?: string; id: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [empty, setEmpty] = useState(true);
  const [data, setData] = useState("");
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current!;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      c.width = r.width * ratio;
      c.height = r.height * ratio;
      const ctx = c.getContext("2d")!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
      setEmpty(true);
      setData("");
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    setData(canvasRef.current!.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    setData("");
  };

  return (
    <form action={action} className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="h-44 w-full touch-none rounded-lg border-2 border-dashed border-gray-300 bg-white"
        />
        {empty && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">Υπογράψτε εδώ με το δάχτυλο ή το ποντίκι</div>}
      </div>
      <input type="hidden" name="signature" value={data} />
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        <input name="signed_by" defaultValue={defaultName} placeholder="Ονοματεπώνυμο υπογράφοντος" className={`${inputCls} flex-1`} required />
        <button type="button" onClick={clear} className={btn.secondary}>
          Καθαρισμός
        </button>
        <button type="submit" disabled={empty} className={btn.primary}>
          Αποθήκευση υπογραφής
        </button>
      </div>
    </form>
  );
}
