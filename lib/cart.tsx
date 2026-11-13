"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { tierPrice, type Tiers } from "@/lib/pricing";

export type CartItem = {
  key: string;
  product_id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number; // ενδεικτική τιμή· η τελική υπολογίζεται στον server
  quantity: number;
  // Κλιμάκια τιμής ανά ποσότητα (μόνο για προϊόντα με κλιμακωτή τιμολόγηση).
  tiers?: Tiers | null;
  // Οι επιλογές του πελάτη (κείμενα, επιλογές, διαδρομές φωτογραφιών).
  custom_design: {
    fields: { id: string; label: string; value: string }[];
    photos: { field: string; path: string }[];
    variant?: string | null; // κλειδί τιμολόγησης (π.χ. "logo_text")· η τιμή τελικά υπολογίζεται στη βάση
  } | null;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "charaxis_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.product_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { ...item, key }]);
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    const q = Math.max(1, Math.min(5000, Math.floor(qty) || 1));
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: q, price: i.tiers ? tierPrice(i.tiers, q) : i.price } : i))
    );
  }, []);
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, ready, add, setQty, remove, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart εκτός CartProvider");
  return c;
}
