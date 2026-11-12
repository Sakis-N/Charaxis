"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";

const METHODS = [
  { code: "acs", label: "ACS Courier στο σπίτι", note: "Παράδοση στη διεύθυνσή σου" },
  { code: "boxnow", label: "BoxNow (θυρίδα)", note: "Παραλαβή από θυρίδα BoxNow" },
  { code: "skroutz", label: "Skroutz Last Mile", note: "Παραλαβή από σημείο Skroutz" },
] as const;

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
const IRIS_ENABLED = process.env.NEXT_PUBLIC_IRIS_ENABLED === "true";

const input =
  "w-full border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, subtotal, clear } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<string>("acs");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState<{ type: string; value: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [payment, setPayment] = useState<string>(STRIPE_ENABLED ? "stripe" : "bank_transfer");
  const [notes, setNotes] = useState("");
  const [shipCost, setShipCost] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickup = method !== "acs";

  // Ζωντανό μεταφορικό (ο ΤΚ μπορεί να το ανεβάσει στα 5€ για δυσπρόσιτες περιοχές).
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("quote_shipping", { p_method: method, p_postcode: postcode });
      if (!cancelled && data != null) setShipCost(Number(data));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [method, postcode]);

  const discount = useMemo(() => {
    if (!couponInfo) return 0;
    const d = couponInfo.type === "percentage" ? (subtotal * couponInfo.value) / 100 : couponInfo.value;
    return Math.min(Math.round(d * 100) / 100, subtotal);
  }, [couponInfo, subtotal]);
  const total = subtotal - discount + (shipCost ?? 0);

  async function applyCoupon() {
    setCouponMsg(null);
    setCouponInfo(null);
    if (!coupon.trim()) return;
    const { data } = await supabase.rpc("validate_coupon", { coupon_code: coupon.trim() });
    const r = Array.isArray(data) ? data[0] : data;
    if (r?.valid) {
      setCouponInfo({ type: r.discount_type, value: Number(r.discount_value) });
      setCouponMsg("Το κουπόνι εφαρμόστηκε ✓");
    } else {
      setCouponMsg(r?.message || "Μη έγκυρο κουπόνι");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return;
    if (!/^[0-9]{5}$/.test(postcode.replace(/\s/g, ""))) {
      setError("Συμπλήρωσε έγκυρο ΤΚ (5 ψηφία).");
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.rpc("create_order", {
      p_customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
      p_items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        custom_design: i.custom_design,
      })),
      p_shipping_method: method,
      p_shipping_address: {
        address: address.trim(),
        city: city.trim(),
        postcode: postcode.replace(/\s/g, ""),
        pickup_point: pickup ? address.trim() : null,
      },
      p_coupon: couponInfo ? coupon.trim() : "",
      p_payment_provider: payment,
      p_notes: notes.trim() || null,
    });
    if (err || !data) {
      setBusy(false);
      setError(err?.message || "Κάτι πήγε στραβά. Δοκίμασε ξανά.");
      return;
    }
    const orderId = (data as { order_id: string }).order_id;

    if (payment === "stripe") {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const j = await res.json();
        if (!res.ok || !j.url) throw new Error(j.error || "Σφάλμα πληρωμής");
        clear();
        window.location.href = j.url;
        return;
      } catch {
        setBusy(false);
        setError(
          `Η παραγγελία καταχωρήθηκε αλλά η σελίδα πληρωμής δεν άνοιξε. Δες την εδώ: /paraggelia/${orderId}`
        );
        return;
      }
    }
    // Email επιβεβαίωσης (δεν περιμένουμε και δεν αποτυγχάνουμε αν σκάσει).
    fetch("/api/notify/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
      keepalive: true,
    }).catch(() => {});
    clear();
    router.push(`/paraggelia/${orderId}`);
  }

  if (ready && items.length === 0) {
    return (
      <main className="flex flex-col overflow-x-hidden">
        <Header />
        <section className="flex flex-col items-start gap-4 px-6 py-16 md:px-16">
          <p className="font-serif text-wood">Το καλάθι σου είναι άδειο.</p>
          <Link href="/proionta" className="bg-ink px-7 py-3 text-sm font-medium text-paper hover:bg-ember">
            Δες τα προϊόντα
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <form onSubmit={submit} className="grid grid-cols-1 gap-12 px-6 py-12 md:px-16 md:py-16 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          <h1 className="text-[28px] font-medium md:text-[34px]">Ολοκλήρωση παραγγελίας</h1>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-medium">Στοιχεία επικοινωνίας</legend>
            <input required className={input} placeholder="Ονοματεπώνυμο" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input required type="email" className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <input required type="tel" className={input} placeholder="Τηλέφωνο" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-medium">Τρόπος αποστολής</legend>
            {METHODS.map((m) => (
              <label key={m.code} className={`flex cursor-pointer items-center justify-between gap-4 border px-4 py-3 text-sm transition-colors duration-200 ${method === m.code ? "border-ink" : "border-line hover:border-ink"}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="method" checked={method === m.code} onChange={() => setMethod(m.code)} className="accent-[#1B1714]" />
                  <span>
                    <span className="font-medium">{m.label}</span>
                    <span className="block text-[13px] text-wood">{m.note}</span>
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-medium">{pickup ? "Σημείο παραλαβής" : "Διεύθυνση παράδοσης"}</legend>
            <input
              required
              className={input}
              placeholder={pickup ? (method === "boxnow" ? "Όνομα / διεύθυνση θυρίδας BoxNow" : "Όνομα / διεύθυνση σημείου Skroutz") : "Οδός και αριθμός"}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete={pickup ? "off" : "street-address"}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input required className={input} placeholder="Πόλη" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
              <input required inputMode="numeric" maxLength={6} className={input} placeholder="ΤΚ" value={postcode} onChange={(e) => setPostcode(e.target.value)} autoComplete="postal-code" />
            </div>
            {pickup && (
              <p className="font-serif text-[13px] text-wood">
                Γράψε ακριβώς το σημείο που θέλεις — θα σου στείλουμε email με το tracking μόλις φύγει η παραγγελία.
              </p>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-medium">Πληρωμή</legend>
            {STRIPE_ENABLED && (
              <label className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm ${payment === "stripe" ? "border-ink" : "border-line hover:border-ink"}`}>
                <input type="radio" name="pay" checked={payment === "stripe"} onChange={() => setPayment("stripe")} className="accent-[#1B1714]" />
                <span>
                  <span className="font-medium">Κάρτα</span>
                  <span className="block text-[13px] text-wood">Ασφαλής πληρωμή μέσω Stripe</span>
                </span>
              </label>
            )}
            {IRIS_ENABLED && (
              <label className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm ${payment === "iris" ? "border-ink" : "border-line hover:border-ink"}`}>
                <input type="radio" name="pay" checked={payment === "iris"} onChange={() => setPayment("iris")} className="accent-[#1B1714]" />
                <span>
                  <span className="font-medium">IRIS</span>
                  <span className="block text-[13px] text-wood">Άμεση πληρωμή από την εφαρμογή της τράπεζάς σου με QR. Θα το δεις μετά την παραγγελία.</span>
                </span>
              </label>
            )}
            <label className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm ${payment === "bank_transfer" ? "border-ink" : "border-line hover:border-ink"}`}>
              <input type="radio" name="pay" checked={payment === "bank_transfer"} onChange={() => setPayment("bank_transfer")} className="accent-[#1B1714]" />
              <span>
                <span className="font-medium">Τραπεζική κατάθεση</span>
                <span className="block text-[13px] text-wood">Θα δεις τα στοιχεία λογαριασμού μετά την παραγγελία. Ξεκινάμε την παραγωγή μόλις εμφανιστεί η κατάθεση.</span>
              </span>
            </label>
          </fieldset>

          <textarea className={input} rows={3} placeholder="Σημειώσεις για την παραγγελία (προαιρετικό)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
        </div>

        <aside className="flex h-fit flex-col gap-5 border border-line p-6 lg:sticky lg:top-24">
          <h2 className="font-medium">Σύνοψη</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">{i.quantity} × {i.name}</span>
                <span className="shrink-0">{(i.price * i.quantity).toFixed(2)} €</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <input className={input} placeholder="Κουπόνι" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button type="button" onClick={applyCoupon} className="border border-ink px-4 text-sm transition-colors hover:border-ember hover:text-ember">
              Εφαρμογή
            </button>
          </div>
          {couponMsg && <p className="-mt-3 text-xs text-wood">{couponMsg}</p>}

          <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><span className="text-wood">Υποσύνολο</span><span>{subtotal.toFixed(2)} €</span></div>
            {discount > 0 && <div className="flex justify-between"><span className="text-wood">Έκπτωση</span><span>−{discount.toFixed(2)} €</span></div>}
            <div className="flex justify-between"><span className="text-wood">Μεταφορικά</span><span>{shipCost == null ? "…" : `${shipCost.toFixed(2)} €`}</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-3 text-base font-semibold"><span>Σύνολο</span><span className="text-ember">{total.toFixed(2)} €</span></div>
          </div>

          {error && <p className="text-sm text-ember-dark">{error}</p>}
          <button
            type="submit"
            disabled={busy || items.length === 0}
            className="bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Καταχώρηση…" : payment === "stripe" ? "Πληρωμή με κάρτα" : "Ολοκλήρωση παραγγελίας"}
          </button>
          <p className="text-[12px] leading-relaxed text-faint">
            Η τελική τιμή υπολογίζεται και επιβεβαιώνεται από τον server κατά την καταχώρηση.
          </p>
        </aside>
      </form>
      <Footer />
    </main>
  );
}
