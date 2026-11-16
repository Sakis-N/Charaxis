"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { METHOD, PAY, code, copy, fmt, money, stageOf, updateOrder, type Order } from "@/components/admin/shared";

// Μεγάλη φωτογραφία πελάτη + σύνδεσμος λήψης (για να την περάσεις στο xTool).
function BigPhoto({ path, onUrl }: { path: string; onUrl: (u: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [dl, setDl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("customer-uploads").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
    supabase.storage.from("customer-uploads").createSignedUrl(path, 3600, { download: true }).then(({ data }) => {
      if (data?.signedUrl) {
        setDl(data.signedUrl);
        onUrl(data.signedUrl);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return (
    <div className="flex flex-col gap-1">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-[260px] max-w-[260px] rounded border border-neutral-300 object-contain" />
      ) : (
        <div className="h-40 w-40 rounded border border-neutral-300" />
      )}
      {dl && <a href={dl} className="text-[12px] underline print:hidden">⬇ Λήψη αρχείου</a>}
    </div>
  );
}

function CopyText({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="shrink-0 rounded-full border border-neutral-300 px-2.5 py-0.5 text-[11.5px] print:hidden"
      onClick={async () => {
        if (await copy(text)) {
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        }
      }}
    >
      {ok ? "✓" : "Αντιγραφή"}
    </button>
  );
}

// Φύλλο παραγωγής: μία σελίδα Α4 ανά παραγγελία, με όλα τα κείμενα και τις
// φωτογραφίες για χάραξη, checklist και ετικέτα διεύθυνσης για κόψιμο.
export default function ProductionSheet({ searchParams }: { searchParams: { ids?: string } }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [downloads] = useState<Set<string>>(() => new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const ids = (searchParams.ids ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x));

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { setDenied(true); return; }
      if (ids.length === 0) { setOrders([]); return; }
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").in("id", ids).order("created_at", { ascending: true });
      if (error) { setDenied(true); return; }
      setOrders((data as Order[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.ids]);

  if (denied) return <main className="p-8">Χρειάζεται σύνδεση. <a className="underline" href="/admin">Σύνδεση στο admin</a></main>;
  if (!orders) return <main className="p-8">Φόρτωση…</main>;
  if (orders.length === 0) return <main className="p-8">Δεν βρέθηκαν παραγγελίες.</main>;

  const toStart = orders.filter((o) => stageOf(o) === "to_start");

  return (
    <div className="min-h-screen bg-neutral-200 py-6 font-display text-neutral-900 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 12mm; } @media print { .sheet { box-shadow: none !important; margin: 0 !important; } }`}</style>

      <div className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center gap-2 px-2 print:hidden">
        <button className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-semibold text-white" onClick={() => window.print()}>
          🖨 Εκτύπωση ({orders.length})
        </button>
        <button
          className="rounded-full border border-neutral-400 bg-white px-4 py-2.5 text-[14px]"
          onClick={() => {
            // Λήψη όλων των φωτογραφιών με τη σειρά (ο browser μπορεί να ζητήσει άδεια για πολλαπλές λήψεις).
            Array.from(downloads).forEach((u, i) => setTimeout(() => {
              const a = document.createElement("a");
              a.href = u;
              a.click();
            }, i * 700));
          }}
        >
          ⬇ Λήψη όλων των φωτογραφιών
        </button>
        {toStart.length > 0 && (
          <button
            className="rounded-full border border-neutral-400 bg-white px-4 py-2.5 text-[14px]"
            onClick={async () => {
              if (!window.confirm(`Σήμανση ${toStart.length} παραγγελιών ως «Σε χάραξη» και email στους πελάτες;`)) return;
              for (const o of toStart) await updateOrder(o.id, { status: "processing" }, "started");
              setMsg(`✓ ${toStart.length} παραγγελίες σημειώθηκαν «Σε χάραξη» και οι πελάτες ενημερώθηκαν.`);
            }}
          >
            🔥 Ξεκίνησα όλες ({toStart.length})
          </button>
        )}
        <a className="ml-auto text-[13px] underline" href="/admin">← Πίσω στο admin</a>
        {msg && <div className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-[14px] text-white">{msg}</div>}
      </div>

      {orders.map((o, idx) => {
        const a = o.shipping_address || {};
        return (
          <section
            key={o.id}
            className="sheet mx-auto mb-6 flex max-w-[210mm] flex-col gap-5 bg-white p-8 shadow-lg print:mb-0 print:p-0"
            style={{ breakAfter: idx < orders.length - 1 ? "page" : "auto" }}
          >
            <header className="flex items-start justify-between gap-4 border-b-2 border-neutral-900 pb-3">
              <div>
                <div className="text-[34px] font-bold leading-none tracking-wide">#{code(o.id)}</div>
                <div className="mt-1.5 text-[15px] font-semibold">{o.customer_name}</div>
                <div className="text-[12.5px] text-neutral-600">{fmt(o.created_at)}</div>
              </div>
              <div className="text-right text-[13px]">
                <div className="text-[18px] font-bold">{METHOD[o.shipping_method] ?? o.shipping_method}</div>
                <div>{money(o.total)} · {PAY[o.payment_provider] ?? o.payment_provider}</div>
                <div className={o.payment_status === "paid" ? "font-semibold" : "font-semibold text-red-700"}>
                  {o.payment_status === "paid" ? "✓ Πληρωμένη" : "⚠ ΔΕΝ έχει πληρωθεί"}
                </div>
              </div>
            </header>

            {o.order_items.map((i) => (
              <div key={i.id} className="flex flex-col gap-3 rounded-lg border-2 border-neutral-300 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[18px] font-bold">
                    <span className="mr-2 rounded bg-neutral-900 px-2 py-0.5 text-white">{i.quantity}×</span>
                    {i.product_name_snapshot}
                  </div>
                </div>
                {i.custom_design?.fields?.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3 border-t border-neutral-200 pt-2">
                    <div className="min-w-0">
                      <div className="text-[11.5px] uppercase tracking-wide text-neutral-500">{f.label}</div>
                      <div className="whitespace-pre-wrap break-words font-serif text-[22px] leading-snug">{f.value}</div>
                    </div>
                    <CopyText text={f.value} />
                  </div>
                ))}
                {(i.custom_design?.photos?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-3">
                    {i.custom_design!.photos!.map((p) => (
                      <BigPhoto key={p.path} path={p.path} onUrl={(u) => downloads.add(u)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {o.notes && (
              <div className="rounded-lg border-2 border-dashed border-neutral-500 p-3 text-[15px]">
                <b>Σημείωση πελάτη:</b> {o.notes}
              </div>
            )}
            {o.admin_notes && (
              <div className="text-[13px] text-neutral-600"><b>Δικές μου σημειώσεις:</b> {o.admin_notes}</div>
            )}

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
              {["Σχέδιο έτοιμο", "Χαράχτηκε", "Έλεγχος", "Πακετάρισμα"].map((c) => (
                <span key={c} className="flex items-center gap-2">
                  <span className="inline-block h-5 w-5 rounded border-2 border-neutral-800" /> {c}
                </span>
              ))}
            </div>

            {/* Ετικέτα διεύθυνσης για κόψιμο */}
            <div className="mt-auto border-t-2 border-dashed border-neutral-400 pt-4">
              <div className="mb-1 text-[10.5px] uppercase tracking-widest text-neutral-400">✂ ετικέτα αποστολής</div>
              <div className="w-[95mm] rounded-lg border-2 border-neutral-900 p-4 text-[15px] leading-snug">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  {METHOD[o.shipping_method] ?? o.shipping_method} · #{code(o.id)}
                </div>
                <div className="mt-1 text-[18px] font-bold">{o.customer_name}</div>
                <div>{a.address}</div>
                <div className="font-semibold">{[a.postcode, a.city].filter(Boolean).join(" ")}</div>
                {o.customer_phone && <div>Τηλ. {o.customer_phone}</div>}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
