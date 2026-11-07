// TODO: αντικατάσταση με πραγματικά δεδομένα από τον πίνακα `products` στο
// Supabase, μόλις οριστικοποιηθεί το data model.
const products = [
  { name: "Μπρελόκ με όνομα & ημερομηνία", material: "Σημύδα 3mm" },
  { name: "Χαραγμένη φωτογραφία ζευγαριού", material: "Σημύδα 3mm" },
  { name: "Μπρελόκ ζευγαριού (μισό-μισό)", material: "Σημύδα 3mm" },
  { name: "Χριστουγεννιάτικο στολίδι με φωτογραφία", material: "Σημύδα 3mm" },
];

export default function FeaturedProducts() {
  return (
    <section className="flex flex-col gap-9 px-6 py-16 md:px-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[28px] font-medium">Δημοφιλή</h2>
        <a href="/proionta" className="text-sm font-semibold text-accent">
          Δες όλα τα προϊόντα →
        </a>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => (
          <div key={p.name} className="flex flex-col gap-2.5">
            <div className="placeholder-tile h-[200px] rounded-xl">
              Φωτογραφία προϊόντος
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {p.material}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug">
              {p.name}
            </h3>
            <div className="text-[15px] font-semibold text-accent">[ΤΙΜΗ]</div>
          </div>
        ))}
      </div>
    </section>
  );
}
