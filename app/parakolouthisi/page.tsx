"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import { extractOrderId, getSavedOrders, shortCode, type SavedOrder } from "@/lib/myOrders";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Αναμονή πληρωμής", cls: "bg-line text-ink" },
  paid: { label: "Πληρώθηκε", cls: "bg-[#E3E6D3] text-ink" },
  processing: { label: "Χαράσσεται", cls: "bg-ember/15 text-ember-dark" },
  shipped: { label: "Στάλθηκε", cls: "bg-ink text-paper" },
  completed: { label: "Παραδόθηκε", cls: "bg-[#CFD5B6] text-ink" },
  cancelled: { label: "Ακυρώθηκε", cls: "bg-line text-wood" },
};

type Live = { status: string; payment_status: string; total: number; items: { name: string; quantity: number }[] };

const input =
  "w-full rounded-full border border-line bg-paper px-5 py-3.5 text-[16px] outline-none transition-colors focus:border-ink md:text-[15px]";

// Ο πελάτης βλέπει τις παραγγελίες του (όσες έκανε από αυτή τη συσκευή)
// ή βρίσκει μια παραγγελία με τον κωδικό #XXXXXXXX και το email/τηλέφωνό του.
export default function TrackPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedOrder[] | null>(null);
  const [live, setLive] = useState<Record<string, Live | null>>({});
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const list = getSavedOrders();
    setSaved(list);
    list.slice(0, 10).forEach(async (o) => {
      const { data } = await supabase.rpc("get_order_public", { p_order: o.id });
      setLive((m) => ({ ...m, [o.id]: (data as Live) ?? null }));
    });
  }, []);

  async function find(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    // Αν επικόλλησε ολόκληρο τον σύνδεσμο από το email, πάμε κατευθείαν.
    const direct = extractOrderId(code);
    if (direct) {
      router.push(`/paraggelia/${direct}`);
      return;
    }
    if (code.replace(/[^0-9a-f]/gi, "").length < 8) {
      setMsg("Γράψε τον κωδικό παραγγελίας (8 χαρακτήρες, π.χ. #3F9A12BC).");
      return;
    }
    if (!contact.trim()) {
      setMsg("Γράψε το email ή το τηλέφωνο που έδωσες στην παραγγελία.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("find_order_public", { p_code: code, p_contact: contact });
    setBusy(false);
    if (error) {
      setMsg("Η αναζήτηση δεν είναι διαθέσιμη αυτή τη στιγμή. Άνοιξε τον σύνδεσμο από το email της παραγγελίας ή γράψε μας.");
      return;
    }
    if (!data) {
      setMsg("Δεν βρήκαμε παραγγελία με αυτά τα στοιχεία. Έλεγξε τον κωδικό και το email/τηλέφωνο.");
      return;
    }
    router.push(`/paraggelia/${data as string}`);
  }

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 md:py-16">
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ember">Παρακολούθηση</span>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[42px]">Πού είναι η παραγγελία μου;</h1>
          <p className="max-w-xl font-serif text-[17px] text-wood">
            Δες σε ποιο βήμα βρίσκεται: πληρωμή, χάραξη, αποστολή, παράδοση. Χωρίς λογαριασμό και χωρίς να ψάχνεις email.
          </p>
        </div>

        {saved && saved.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[17px] font-semibold">Οι παραγγελίες σου από αυτή τη συσκευή</h2>
            <ul className="flex flex-col gap-3">
              {saved.map((o) => {
                const l = live[o.id];
                const st = l ? STATUS[l.status] ?? { label: l.status, cls: "bg-line" } : null;
                return (
                  <li key={o.id}>
                    <Link
                      href={`/paraggelia/${o.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:border-ink md:p-5"
                    >
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2.5">
                          <span className="font-semibold">#{shortCode(o.id)}</span>
                          {st && <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${st.cls}`}>{st.label}</span>}
                          {l === null && <span className="text-[12px] text-faint">δεν βρέθηκε</span>}
                        </span>
                        <span className="truncate text-[13px] text-wood">
                          {new Date(o.at).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric" })}
                          {l?.items?.length ? ` · ${l.items.map((i) => i.name).join(", ")}` : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {l && <span className="font-semibold">{Number(l.total).toFixed(2)} €</span>}
                        <span className="text-wood">→</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <form onSubmit={find} className="flex flex-col gap-4 rounded-2xl bg-ink p-6 text-paper md:p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[20px] font-semibold">Βρες μια παραγγελία</h2>
            <p className="font-serif text-[14.5px] text-paper/65">
              Τον κωδικό (π.χ. #3F9A12BC) τον βρίσκεις στο email επιβεβαίωσης. Μπορείς επίσης να επικολλήσεις ολόκληρο τον σύνδεσμο.
            </p>
          </div>
          <input className={`${input} text-ink`} placeholder="Κωδικός ή σύνδεσμος παραγγελίας" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
          <input className={`${input} text-ink`} placeholder="Email ή τηλέφωνο της παραγγελίας" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
          {msg && <p className="text-[14px] text-[#FFB58F]">{msg}</p>}
          <button type="submit" disabled={busy} className="rounded-full bg-ember px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ember-dark disabled:opacity-60">
            {busy ? "Αναζήτηση…" : "Δες την παραγγελία"}
          </button>
        </form>
      </section>
      <Footer />
    </main>
  );
}
