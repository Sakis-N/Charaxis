// TODO: αντικατάσταση με πραγματικά δεδομένα από τον πίνακα `products` στο
// Supabase, μόλις οριστικοποιηθεί το data model.
const products = [
  { name: "Μπρελόκ με όνομα & ημερομηνία", material: "Ξύλο" },
  { name: "Χαραγμένη φωτογραφία ζευγαριού", material: "Ξύλο" },
  { name: "Μπρελόκ ζευγαριού (μισό-μισό)", material: "Ξύλο" },
  { name: "Χριστουγεννιάτικο στολίδι με φωτογραφία", material: "Ξύλο" },
];

export default function FeaturedProducts() {
  return (
    <section className="flex flex-col gap-9 px-6 py-16 md:px-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[28px] font-medium">Δημοφιλή</h2>
        <a
          href="/proionta"
          className="group flex items-center text-sm font-semibold text-accent"
        >
          Δες όλα τα προϊόντα
          <span className="ml-1 inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => (
          <div key={p.name} className="group flex flex-col gap-2.5">
            <div className="placeholder-tile h-[200px] overflow-hidden rounded-xl transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
              <span className="inline-block transition-transform duration-500 ease-out group-hover:scale-110">
                Φωτογραφία προϊόντος
              </span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {p.material}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug transition-colors duration-200 group-hover:text-accent">
              {p.name}
            </h3>
            <div className="text-[15px] font-semibold text-accent">[ΤΙΜΗ]</div>
          </div>
        ))}
      </div>
    </section>
  );
}
