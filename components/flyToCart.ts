// Μικρή "πετώντας" κουκκίδα από το κουμπί προς το καλάθι του header,
// και ένα event ώστε το καλάθι να κάνει bump. Σέβεται prefers-reduced-motion.
export function flyToCart(from: HTMLElement) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("cart:add"));

  const target = document.getElementById("cart-button");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!target || reduce) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const startX = a.left + a.width / 2;
  const startY = a.top + a.height / 2;
  const dx = b.left + b.width / 2 - startX;
  const dy = b.top + b.height / 2 - startY;

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "fixed",
    left: `${startX - 8}px`,
    top: `${startY - 8}px`,
    width: "16px",
    height: "16px",
    borderRadius: "9999px",
    background: "#E2430F",
    zIndex: "200",
    pointerEvents: "none",
  });
  document.body.appendChild(dot);

  const anim = dot.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.7 },
    ],
    { duration: 700, easing: "cubic-bezier(0.5, -0.2, 0.7, 1)" }
  );
  anim.onfinish = () => dot.remove();
}
