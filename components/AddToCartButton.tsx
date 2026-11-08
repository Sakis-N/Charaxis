"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { flyToCart } from "@/components/flyToCart";

export default function AddToCartButton(p: {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={(e) => {
          cart.add({
            product_id: p.productId,
            slug: p.slug,
            name: p.name,
            image: p.image,
            price: p.price,
            quantity: 1,
            custom_design: null,
          });
          setAdded(true);
          flyToCart(e.currentTarget);
        }}
        className="w-fit bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember"
      >
        {added ? "Προστέθηκε ✓" : "Προσθήκη στο καλάθι"}
      </button>
      {added && (
        <Link href="/kalathi" className="text-sm text-wood underline underline-offset-2 hover:text-ember">
          Δες το καλάθι
        </Link>
      )}
    </div>
  );
}
