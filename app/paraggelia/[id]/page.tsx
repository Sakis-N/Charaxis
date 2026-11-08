"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import { BANK } from "@/lib/business";

type Order = {
  id: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  payment_provider: string;
  payment_status: string;
  customer_email: string;
  status: string;
  tracking_number: string | null;
  items: { name: string; quantity: number; line_total: number }[];
};

const IBAN = BANK.iban;
const BANK_NAME = BANK.name;
const BANK_HOLDER = BANK.holder;

const STATUS_LABEL: Record<string, string> = {
  pending: "Σε αναμονή",
  paid: "Πληρώθηκε",
  processing: "Σε παραγωγή",
  shipped: "Στάλθηκε",
  completed: "Ολοκληρώθηκε",
  cancelled: "Ακυρώθηκε",
};

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data } = await supabase.rpc("get_order_public", { p_order: params.id });
      if (alive) {
        setOrder((data as Order) ?? null);
        setLoading(false);
      }
    }
    load();
    // Μετά από πληρωμή Stripe το webhook μπορεί να αργήσει λίγα δευτερόλεπτα.
    const t = setInterval(load, 5000);
    const stop = setTimeout(() => clearInterval(t), 60000);
    return () => {
      alive = false;
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [params.id]);

  const shortId = params.id.slice(0, 8).toUpperCase();

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex max-w-2xl flex-col gap-6 px-6 py-12 md:px-16 md:py-16">
        {loading ? null : !order ? (
          <p className="font-serif text-wood">Δεν βρέθηκε η παραγγελία.</p>
        ) : (
          <>
            <div className="text-[13px] text-wood">Παραγγελία #{shortId}</div>
            <h1 className="text-[28px] font-medium md:text-[34px]">
              {order.payment_status === "paid" ? "Ευχαριστούμε! Πληρώθηκε ✓" : "Η παραγγελία σου καταχωρήθηκε"}
            </h1>
            <p className="font-serif text-wood">
              Θα λάβεις ενημέρωση στο {order.customer_email}. Φύλαξε αυτόν τον σύνδεσμο για να βλέπεις την κατάσταση.
            </p>

            {order.payment_provider === "bank_transfer" && order.payment_status !== "paid" && (
              <div className="flex flex-col gap-2 border border-ink p-5 text-sm">
                <div className="font-medium">Στοιχεία κατάθεσης</div>
                {IBAN ? (
                  <>
                    {BANK_NAME && <div>Τράπεζα: {BANK_NAME}</div>}
                    {BANK_HOLDER && <div>Δικαιούχος: {BANK_HOLDER}</div>}
                    <div className="break-all">IBAN: <span className="font-medium">{IBAN}</span></div>
                  </>
                ) : (
                  <div className="text-wood">Θα σου στείλουμε τα στοιχεία λογαριασμού με email.</div>
                )}
                <div>Ποσό: <span className="font-medium text-ember">{Number(order.total).toFixed(2)} €</span></div>
                <div>Αιτιολογία: <span className="font-medium">#{shortId}</span></div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span><span className="text-wood">Κατάσταση:</span> <b className="font-medium">{STATUS_LABEL[order.status] ?? order.status}</b></span>
              {order.tracking_number && (
                <span><span className="text-wood">Tracking:</span> <b className="font-medium">{order.tracking_number}</b></span>
              )}
            </div>

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

            <Link href="/proionta" className="w-fit text-sm underline underline-offset-2 hover:text-ember">
              Συνέχεια αγορών
            </Link>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
