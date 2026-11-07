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
          <a
            key={cat.name}
            href={cat.href}
            className="group flex flex-col gap-3.5"
          >
            <div className="placeholder-tile h-[260px] overflow-hidden rounded-2xl transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
              <span className="inline-block transition-transform duration-500 ease-out group-hover:scale-110">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold transition-colors duration-200 group-hover:text-accent">
                {cat.name}
              </h3>
              <span className="flex items-center text-[13.5px] font-semibold text-accent">
                Δες προϊόντα
                <span className="ml-1 inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </a>
        ))}

        <a
          id="quote"
          href="mailto:info@charaxis.gr?subject=Ζήτηση προσφοράς"
          className="group flex h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-accent/60 p-6 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-accent hover:border-solid hover:shadow-xl hover:shadow-accent/10"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-300 ease-out group-hover:rotate-90"
          >
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
