const categories = [
  { name: "Μπρελόκ", href: "/kategories/mpreloka" },
  { name: "Χαραγμένη Φωτογραφία", href: "/kategories/xaragmeni-fotografia" },
  { name: "Χριστουγεννιάτικα Στολίδια", href: "/kategories/xristougeniatika" },
];

export default function Categories() {
  return (
    <section
      id="categories"
      className="flex flex-col gap-9 bg-white px-6 py-14 md:px-16 md:py-24"
    >
      <h2 className="text-[28px] font-medium">Κατηγορίες</h2>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col gap-3.5">
            <div className="placeholder-tile h-[260px] rounded-2xl">
              {cat.name}
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{cat.name}</h3>
              <a href={cat.href} className="text-[13.5px] font-semibold text-accent">
                Δες προϊόντα →
              </a>
            </div>
          </div>
        ))}

        <a
          id="quote"
          href="mailto:info@charaxis.gr?subject=Ζήτηση προσφοράς"
          className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-accent/60 p-6 text-center transition-colors hover:border-accent"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="#B5692E"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <h3 className="text-lg font-semibold">Κάτι άλλο;</h3>
          <p className="max-w-[200px] text-[13.5px] leading-relaxed text-muted">
            Ρολόγια, φωτιστικά, επιγραφές, χάραξη σε μαχαίρια και ό,τι άλλο
            φανταστείς — ζήτα προσφορά.
          </p>
        </a>
      </div>
    </section>
  );
}
