const categories = [
  { name: "Μπρελόκ", href: "/kategories/mpreloka" },
  { name: "Art Prints", href: "/kategories/art-prints" },
  { name: "Διακοσμητικά", href: "/kategories/diakosmitika" },
];

export default function Categories() {
  return (
    <section
      id="categories"
      className="flex flex-col gap-9 bg-white px-6 py-14 md:px-16 md:py-24"
    >
      <h2 className="text-[28px] font-medium">Κατηγορίες</h2>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
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
      </div>
    </section>
  );
}
