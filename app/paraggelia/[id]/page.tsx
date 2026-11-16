"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import { BANK, IRIS, PRODUCTION_TIME } from "@/lib/business";
import { saveOrder, shortCode } from "@/lib/myOrders";

type Order = {
  id: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  payment_provider: string;
  payment_status: string;
  customer_email: string;
  customer_name?: string | null;
  shipping_method?: string | null;
  production_time?: string | null;
  status: string;
  tracking_number: string | null;
  items: { name: string; quantity: number; line_total: number }[];
};

const IBAN = BANK.iban;
const BANK_NAME = BANK.name;
const BANK_HOLDER = BANK.holder;

const COURIER: Record<string, string> = {
  acs: "ACS Courier",
  boxnow: "BoxNow",
  skroutz: "Skroutz Last Mile",
};

type Step = { label: string; hint: string; done: boolean; icon: string };

// Βήματα προόδου που βλέπει ο πελάτης (βγαίνουν από status + payment_status).
// Το "τρέχον" βήμα είναι αυτό που γίνεται τώρα· όσα είναι πριν από αυτό έχουν ολοκληρωθεί.
function progressSteps(o: Order): Step[] {
  const paid = o.payment_status === "paid" || ["paid", "processing", "shipped", "completed"].includes(o.status);
  const courier = o.shipping_method ? COURIER[o.shipping_method] : null;
  const prodTime = o.production_time || PRODUCTION_TIME;
  // 1 = πληρωμή, 2 = χάραξη, 3 = καθ' οδόν, 5 = όλα ολοκληρωμένα
  const current =
    o.status === "completed" ? 5 : o.status === "shipped" ? 3 : o.status === "processing" || paid ? 2 : 1;
  const steps: Omit<Step, "done">[] = [
    { label: "Καταχωρήθηκε", hint: "Λάβαμε την παραγγελία σου.", icon: "M9 12l2 2 4-4M5 4h14v16H5z" },
    {
      label: "Πληρωμή",
      hint: current > 1 ? "Η πληρωμή επιβεβαιώθηκε." : "Περιμένουμε να εμφανιστεί η πληρωμή σου για να ξεκινήσουμε.",
      icon: "M3 7h18v10H3zM3 11h18M7 15h3",
    },
    {
      label: "Χαράσσεται",
      hint:
        current > 2
          ? "Η χάραξη ολοκληρώθηκε."
          : o.status === "processing"
            ? `Το κομμάτι σου χαράσσεται στο εργαστήριο · ${prodTime}`
            : `Ξεκινάμε τη χάραξη σύντομα · ${prodTime}`,
      icon: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
    },
    {
      label: "Καθ' οδόν",
      hint: current >= 3 ? `Στάλθηκε${courier ? ` με ${courier}` : ""} και έρχεται σε σένα.` : courier ? `Θα φύγει με ${courier}.` : "Θα σου στείλουμε τον αριθμό αποστολής.",
      icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
    },
    { label: "Παραδόθηκε", hint: current >= 5 ? "Καλή απόλαυση! 🎁" : "Σύντομα στα χέρια σου.", icon: "M20 7L9 18l-5-5" },
  ];
  return steps.map((s, i) => ({ ...s, done: i < current }));
}

function ShareLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(window.location.href.split("?")[0]);
    setCanShare(typeof navigator.share === "function");
  }, [id]);
  const text = `Η παραγγελία μου στο Charaxis (#${shortCode(id)}): ${url}`;
  const btn = "flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-semibold transition-colors hover:border-ink";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-[#EAE3D3]/60 p-5">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold">Κράτα αυτόν τον σύνδεσμο</span>
        <span className="font-serif text-[14px] text-wood">
          Από εδώ βλέπεις κάθε βήμα της παραγγελίας σου, όποτε θες. Στείλ&apos; τον στον εαυτό σου για να τον έχεις πρόχειρο.
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
        >
          {copied ? "Αντιγράφηκε ✓" : "Αντιγραφή συνδέσμου"}
        </button>
        <a className={btn} href={`viber://forward?text=${encodeURIComponent(text)}`}>
          Viber
        </a>
        <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        {canShare && (
          <button
            type="button"
            className={btn}
            onClick={() => navigator.share({ title: "Η παραγγελία μου στο Charaxis", text, url }).catch(() => {})}
          >
            Κοινοποίηση…
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data } = await supabase.rpc("get_order_public", { p_order: params.id });
      if (!alive) return;
      const o = (data as Order) ?? null;
      setOrder(o);
      setLoading(false);
      setUpdatedAt(new Date());
      if (o) saveOrder({ id: o.id, at: new Date().toISOString(), total: Number(o.total) });
    }
    load();
    // Τα πρώτα λεπτά (π.χ. μετά από πληρωμή Stripe) ανανεώνουμε συχνά, μετά κάθε 30''
    // και μόνο όσο η σελίδα είναι ανοιχτή μπροστά στον πελάτη.
    let n = 0;
    const t = setInterval(() => {
      n++;
      if (document.visibilityState !== "visible") return;
      if (n <= 12 || n % 6 === 0) load();
    }, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [params.id]);

  const shortId = params.id.slice(0, 8).toUpperCase();
  const steps = order ? progressSteps(order) : [];
  const current = steps.findIndex((st) => !st.done);
  // Η γραμμή φτάνει μέχρι το τρέχον βήμα (ή ως το τέλος αν ολοκληρώθηκαν όλα).
  const pct = steps.length ? ((current === -1 ? steps.length - 1 : current) / (steps.length - 1)) * 100 : 0;

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-6 py-12 md:py-16">
        {loading ? (
          <p className="font-serif text-wood">Φόρτωση…</p>
        ) : !order ? (
          <div className="flex flex-col items-start gap-4">
            <p className="font-serif text-wood">Δεν βρέθηκε η παραγγελία.</p>
            <Link href="/parakolouthisi" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-ember">
              Βρες την παραγγελία σου
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-wood">
                <span className="rounded-full border border-line px-3 py-1 font-semibold tracking-wide text-ink">#{shortId}</span>
                {updatedAt && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" aria-hidden="true" />
                    Ζωντανή ενημέρωση · {updatedAt.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <h1 className="text-[30px] font-semibold leading-tight tracking-tight md:text-[40px]">
                {order.status === "cancelled"
                  ? "Η παραγγελία ακυρώθηκε"
                  : order.status === "completed"
                    ? "Παραδόθηκε! 🎉"
                    : order.customer_name
                      ? `Ευχαριστούμε, ${order.customer_name.split(" ")[0]}!`
                      : "Ευχαριστούμε για την παραγγελία!"}
              </h1>
              {order.status !== "cancelled" && current !== -1 && (
                <p className="font-serif text-[17px] text-wood">{steps[current]?.hint}</p>
              )}
            </div>

            {order.status !== "cancelled" && (
              <div className="rounded-2xl border border-line p-5 md:p-7">
                {/* Desktop: οριζόντια πορεία */}
                <div className="relative hidden md:block">
                  <div className="absolute left-[10%] right-[10%] top-5 h-[3px] rounded-full bg-line" />
                  <div
                    className="absolute left-[10%] top-5 h-[3px] rounded-full bg-ember transition-all duration-700"
                    style={{ width: `${pct * 0.8}%` }}
                  />
                  <ol className="relative grid grid-cols-5">
                    {steps.map((st, i) => (
                      <li key={i} className="flex flex-col items-center gap-2.5 text-center">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
                            st.done ? "border-ink bg-ink text-paper" : i === current ? "border-ember bg-paper text-ember shadow-[0_0_0_6px_rgba(226,67,15,0.12)]" : "border-line bg-paper text-faint"
                          }`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d={st.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className={`text-[13.5px] font-semibold ${st.done ? "" : i === current ? "text-ember" : "text-faint"}`}>{st.label}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                {/* Κινητό: κάθετη πορεία με περιγραφές */}
                <ol className="flex flex-col md:hidden">
                  {steps.map((st, i) => (
                    <li key={i} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                            st.done ? "border-ink bg-ink text-paper" : i === current ? "border-ember text-ember" : "border-line text-faint"
                          }`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d={st.icon} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {i < steps.length - 1 && <span className={`w-[2px] grow ${st.done ? "bg-ink" : "bg-line"}`} style={{ minHeight: 22 }} />}
                      </div>
                      <div className="flex flex-col pb-5 pt-1.5">
                        <span className={`text-[15px] font-semibold ${st.done ? "" : i === current ? "text-ember" : "text-faint"}`}>{st.label}</span>
                        {(st.done || i === current) && <span className="font-serif text-[13.5px] text-wood">{st.hint}</span>}
                      </div>
                    </li>
                  ))}
                </ol>

                {order.tracking_number && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink px-5 py-4 text-paper">
                    <span className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                        Αριθμός αποστολής{order.shipping_method && COURIER[order.shipping_method] ? ` · ${COURIER[order.shipping_method]}` : ""}
                      </span>
                      <span className="text-[18px] font-semibold tracking-wide">{order.tracking_number}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(order.tracking_number!).catch(() => {})}
                      className="rounded-full border border-paper/30 px-4 py-2 text-[13px] font-semibold hover:border-paper"
                    >
                      Αντιγραφή
                    </button>
                  </div>
                )}
              </div>
            )}

            {order.payment_provider === "iris" && order.payment_status !== "paid" && order.status !== "cancelled" && (
              <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink p-5 text-sm">
                <div className="text-[16px] font-semibold">Πληρωμή με IRIS</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={IRIS.qr} alt="IRIS QR" width={220} height={220} className="h-auto w-[220px] max-w-full border border-line" />
                <ol className="flex list-decimal flex-col gap-1 pl-5">
                  <li>Άνοιξε την εφαρμογή της τράπεζάς σου και διάλεξε πληρωμή με IRIS / σάρωση QR.</li>
                  <li>Σάρωσε τον κωδικό και γράψε το ποσό: <span className="font-medium text-ember">{Number(order.total).toFixed(2)} €</span></li>
                  <li>Στο σχόλιο γράψε τον αριθμό παραγγελίας: <span className="font-medium">#{shortId}</span></li>
                </ol>
                <div className="text-wood">Ξεκινάμε την παραγωγή μόλις εμφανιστεί η πληρωμή στον λογαριασμό μας.</div>
              </div>
            )}

            {order.payment_provider === "bank_transfer" && order.payment_status !== "paid" && order.status !== "cancelled" && (
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-ink p-5 text-sm">
                <div className="text-[16px] font-semibold">Στοιχεία κατάθεσης</div>
                {IBAN ? (
                  <>
                    {BANK_NAME && <div>Τράπεζα: {BANK_NAME}</div>}
                    {BANK_HOLDER && <div>Δικαιούχος: {BANK_HOLDER}</div>}
                    <div className="flex flex-wrap items-center gap-2 break-all">
                      IBAN: <span className="font-medium">{IBAN}</span>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(IBAN.replace(/\s/g, "")).catch(() => {})} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] hover:border-ink">
                        Αντιγραφή
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-wood">Θα σου στείλουμε τα στοιχεία λογαριασμού με email.</div>
                )}
                <div>Ποσό: <span className="font-medium text-ember">{Number(order.total).toFixed(2)} €</span></div>
                <div>Αιτιολογία: <span className="font-medium">#{shortId}</span></div>
              </div>
            )}

            <ShareLink id={order.id} />

            <div className="flex flex-col gap-3">
              <h2 className="text-[17px] font-semibold">Τι παρήγγειλες</h2>
              <ul className="flex flex-col gap-2 border-y border-line py-4 text-sm">
                {order.items.map((i, n) => (
                  <li key={n} className="flex justify-between gap-3">
                    <span>{i.quantity} × {i.name}</span>
                    <span>{Number(i.line_total).toFixed(2)} €</span>
                  </li>
                ))}
                <li className="flex justify-between text-wood"><span>Μεταφορικά</span><span>{Number(order.shipping).toFixed(2)} €</span></li>
                {Number(order.discount) > 0 && <li className="flex justify-between text-wood"><span>Έκπτωση</span><span>−{Number(order.discount).toFixed(2)} €</span></li>}
                <li className="flex justify-between font-semibold"><span>Σύνολο</span><span>{Number(order.total).toFixed(2)} €</span></li>
              </ul>
              <p className="font-serif text-[14px] text-wood">
                Ενημερώσεις στέλνουμε και στο {order.customer_email}. Για οτιδήποτε, απάντησε σε εκείνο το email ή{" "}
                <Link href="/epikoinonia" className="text-ink underline underline-offset-2 hover:text-ember">γράψε μας</Link>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/proionta" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ember">
                Συνέχεια αγορών
              </Link>
              <Link href="/parakolouthisi" className="rounded-full border border-line px-6 py-3 text-sm font-semibold hover:border-ink">
                Όλες οι παραγγελίες μου
              </Link>
            </div>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
