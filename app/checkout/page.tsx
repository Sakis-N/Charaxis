"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import { unitPrice, useCart } from "@/lib/cart";
import { SALE, salePercent } from "@/lib/sale";
import { saveOrder } from "@/lib/myOrders";
import FreeShippingBar, { useFreeShippingFrom } from "@/components/FreeShippingBar";

const METHODS = [
  { code: "acs", label: "ACS Courier στο σπίτι", note: "Παράδοση στη διεύθυνσή σου" },
  { code: "boxnow", label: "BoxNow (θυρίδα)", note: "Παραλαβή από θυρίδα BoxNow" },] as const;

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
const IRIS_ENABLED = process.env.NEXT_PUBLIC_IRIS_ENABLED === "true";

const input =
  "w-full border border-line bg-paper px-4 py-3 text-[16px] outline-none transition-colors duration-200 focus:border-ink md:text-sm";

// Τα στοιχεία του πελάτη μένουν μόνο στον δικό του browser, για την επόμενη παραγγελία.
const SAVED_KEY = "charaxis_customer_v1";
type Saved = { name: string; email: string; phone: string; method: string; address: string; city: string; postcode: string };

// Μετατρέπει τεχνικά μηνύματα της βάσης σε κάτι κατανοητό για τον πελάτη.
function friendlyError(msg: string | undefined): string {
  if (!msg) return "Κάτι πήγε στραβά. Δοκίμασε ξανά σε λίγο.";
  if (/fetch|network|Failed to fetch/i.test(msg)) return "Δεν υπάρχει σύνδεση. Έλεγξε το internet σου και δοκίμασε ξανά.";
  if (/email/i.test(msg)) return "Έλεγξε ότι το email είναι σωστό.";
  if (/phone|τηλ/i.test(msg)) return "Έλεγξε ότι το τηλέφωνο είναι σωστό.";
  if (/coupon|κουπ/i.test(msg)) return "Το κουπόνι δεν ισχύει πια. Αφαίρεσέ το και δοκίμασε ξανά.";
  if (/product|προϊ/i.test(msg)) return "Κάποιο προϊόν του καλαθιού δεν είναι πλέον διαθέσιμο. Έλεγξε το καλάθι σου.";
  return msg;
}

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
  const [remember, setRemember] = useState(true);
  const [methodCosts, setMethodCosts] = useState<Record<string, number>>({});

  const pickup = method !== "acs";
  const BN_PARTNER = process.env.NEXT_PUBLIC_BOXNOW_PARTNER_ID;
  const useMap = pickup && Boolean(BN_PARTNER);
  const [lockerId, setLockerId] = useState("");

  // Χάρτης θυρίδων BoxNow: φορτώνεται μόνο όταν επιλεγεί BoxNow και υπάρχει partner id.
  useEffect(() => {
    if (!useMap) return;
    const w = window as unknown as Record<string, unknown>;
    w._bn_map_widget_config = {
      partnerId: Number(BN_PARTNER),
      parentElement: "#boxnowmap",
      type: "popup",
      autoclose: true,
      autoselect: false,
      buttonSelector: ".boxnow-map-widget-button",
      afterSelect: (sel: { boxnowLockerId?: string; boxnowLockerAddressLine1?: string; boxnowLockerPostalCode?: string; boxnowLockerName?: string }) => {
        setLockerId(String(sel.boxnowLockerId ?? ""));
        setAddress([sel.boxnowLockerName, sel.boxnowLockerAddressLine1].filter(Boolean).join(" — ") || String(sel.boxnowLockerAddressLine1 ?? ""));
        if (sel.boxnowLockerPostalCode) setPostcode(String(sel.boxnowLockerPostalCode).replace(/\s/g, ""));
      },
    };
    // Το iframe του BoxNow έρχεται με z-index:auto και το σκεπάζουν η περίληψη, το χιόνι και τα λαμπάκια.
    if (!document.getElementById("bn-widget-css")) {
      const st = document.createElement("style");
      st.id = "bn-widget-css";
      st.textContent = 'iframe[id^="boxnow_map_widget"]{z-index:2147483000!important}';
      document.head.appendChild(st);
    }
    if (!document.getElementById("bn-widget-js")) {
      const sc = document.createElement("script");
      sc.id = "bn-widget-js";
      sc.src = "https://widget-cdn.boxnow.gr/map-widget/client/v5.js";
      sc.async = true;
      document.head.appendChild(sc);
    }
  }, [useMap, BN_PARTNER]);

  // Συμπλήρωση από την προηγούμενη παραγγελία (αν ο πελάτης το επέλεξε τότε).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<Saved>;
      if (s.name) setName(s.name);
      if (s.email) setEmail(s.email);
      if (s.phone) setPhone(s.phone);
      if (s.method && METHODS.some((m) => m.code === s.method)) setMethod(s.method);
      if (s.address) setAddress(s.address);
      if (s.city) setCity(s.city);
      if (s.postcode) setPostcode(s.postcode);
    } catch {}
  }, []);

  // Κόστος κάθε τρόπου αποστολής, για να φαίνεται δίπλα στην επιλογή.
  useEffect(() => {
    let cancelled = false;
    const pc = postcode.replace(/\s/g, "");
    const t = setTimeout(async () => {
      const entries = await Promise.all(
        METHODS.map(async (m) => {
          const { data } = await supabase.rpc("quote_shipping", { p_method: m.code, p_postcode: pc });
          return [m.code, data == null ? NaN : Number(data)] as const;
        })
      );
      if (!cancelled) setMethodCosts(Object.fromEntries(entries.filter(([, v]) => !Number.isNaN(v))));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [postcode]);

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

  const saved = useMemo(
    () => Math.round(items.reduce((n, i) => n + (i.price - unitPrice(i)) * i.quantity, 0) * 100) / 100,
    [items]
  );
  const discount = useMemo(() => {
    if (!couponInfo) return 0;
    const d = couponInfo.type === "percentage" ? (subtotal * couponInfo.value) / 100 : couponInfo.value;
    return Math.min(Math.round(d * 100) / 100, subtotal);
  }, [couponInfo, subtotal]);
  // Δωρεάν μεταφορικά πάνω από το όριο (ο server εφαρμόζει τον ίδιο κανόνα).
  const freeFrom = useFreeShippingFrom();
  const freeShip = freeFrom != null && subtotal - discount >= freeFrom;
  const total = subtotal - discount + (freeShip ? 0 : shipCost ?? 0);

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
    if (useMap && !lockerId) {
      setError("Διάλεξε θυρίδα BoxNow από τον χάρτη.");
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
        locker_id: useMap ? lockerId : null,
      },
      p_coupon: couponInfo ? coupon.trim() : "",
      p_payment_provider: payment,
      p_notes: notes.trim() || null,
    });
    if (err || !data) {
      setBusy(false);
      setError(friendlyError(err?.message));
      return;
    }
    const orderId = (data as { order_id: string }).order_id;
    saveOrder({ id: orderId, at: new Date().toISOString(), total: Math.round(total * 100) / 100 });

    try {
      if (remember) {
        const s: Saved = { name: name.trim(), email: email.trim(), phone: phone.trim(), method, address: address.trim(), city: city.trim(), postcode: postcode.replace(/\s/g, "") };
        localStorage.setItem(SAVED_KEY, JSON.stringify(s));
      } else {
        localStorage.removeItem(SAVED_KEY);
      }
    } catch {}

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
                {methodCosts[m.code] != null &&
                  (freeShip ? (
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-faint line-through">{methodCosts[m.code].toFixed(2)} €</span>
                      <span className="font-semibold text-[#5A6B2A]">Δωρεάν</span>
                    </span>
                  ) : (
                    <span className="shrink-0 font-medium">{methodCosts[m.code].toFixed(2)} €</span>
                  ))}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-medium">{pickup ? "Σημείο παραλαβής" : "Διεύθυνση παράδοσης"}</legend>
            {useMap && (
              <div className="flex flex-col gap-3 border border-line p-4">
                <p className="text-[13px] font-medium">BOX NOW Lockers | Γρήγορη παράδοση, 24/7</p>
                <button type="button" className="boxnow-map-widget-button self-start rounded-full border border-ink px-5 py-2 text-sm font-medium hover:bg-ink hover:text-white">
                  {lockerId ? "Αλλαγή θυρίδας" : "Διάλεξε θυρίδα στον χάρτη"}
                </button>
                {lockerId && <p className="text-sm">✓ {address}</p>}
                <div id="boxnowmap" />
              </div>
            )}
            {!useMap && (
              <input
                required
                className={input}
                placeholder={pickup ? "Όνομα / διεύθυνση θυρίδας BoxNow" : "Οδός και αριθμός"}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete={pickup ? "off" : "street-address"}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input required className={input} placeholder="Πόλη" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
              <input required inputMode="numeric" maxLength={6} className={input} placeholder="ΤΚ" value={postcode} onChange={(e) => setPostcode(e.target.value)} autoComplete="postal-code" />
            </div>
            {pickup && !useMap && (
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

          <label className="-mt-4 flex cursor-pointer items-center gap-3 text-sm text-wood">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#1B1714]" />
            Θυμήσου τα στοιχεία μου σε αυτή τη συσκευή για την επόμενη παραγγελία
          </label>
        </div>

        <aside className="flex h-fit flex-col gap-5 border border-line p-6 lg:sticky lg:top-24">
          <h2 className="font-medium">Σύνοψη</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex items-center gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-line bg-line/40">
                  {i.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt="" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-sm bg-ink px-1 text-[10.5px] font-semibold text-paper">
                    {i.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1 break-words leading-snug">{i.name}</span>
                <span className="shrink-0">{(unitPrice(i) * i.quantity).toFixed(2)} €</span>
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

          <FreeShippingBar amount={subtotal - discount} compact />

          <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><span className="text-wood">Υποσύνολο</span><span>{subtotal.toFixed(2)} €</span></div>
            {saved > 0 && (
              <div className="flex justify-between text-[13px] font-medium text-ember">
                <span>🖤 {SALE.name} -{salePercent()}%</span>
                <span className="whitespace-nowrap">κερδίζεις {saved.toFixed(2)} €</span>
              </div>
            )}
            {discount > 0 && <div className="flex justify-between"><span className="text-wood">Έκπτωση</span><span>−{discount.toFixed(2)} €</span></div>}
            <div className="flex justify-between">
              <span className="text-wood">Μεταφορικά</span>
              <span>{freeShip ? <b className="text-[#5A6B2A]">Δωρεάν</b> : shipCost == null ? "…" : `${shipCost.toFixed(2)} €`}</span>
            </div>
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
