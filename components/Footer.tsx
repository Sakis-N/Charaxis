export default function Footer() {
  return (
    <footer id="contact">
      <div className="flex flex-wrap justify-between gap-12 border-t border-line px-6 py-16 md:px-16">
        <div className="flex max-w-[280px] flex-1 basis-[260px] flex-col gap-3">
          <div className="text-xl font-semibold">Charaxis</div>
          <p className="font-serif text-[15px] leading-relaxed text-wood">
            Εργαστήριο χαμηλής όχλησης, custom laser χαράξεις σε ξύλο. Κάθε
            κομμάτι φτιάχνεται ένα-ένα, κατόπιν παραγγελίας.
          </p>
        </div>

        <div className="flex flex-1 basis-[160px] flex-col gap-2.5 text-sm">
          <div className="mb-1 font-medium">Κατάστημα</div>
          <a href="#categories" className="text-wood transition-colors duration-200 hover:text-ember">
            Μπρελόκ
          </a>
          <a href="#categories" className="text-wood transition-colors duration-200 hover:text-ember">
            Χαραγμένη Φωτογραφία
          </a>
          <a href="#categories" className="text-wood transition-colors duration-200 hover:text-ember">
            Χριστουγεννιάτικα Στολίδια
          </a>
          <a href="#quote" className="text-wood transition-colors duration-200 hover:text-ember">
            Ζήτα Προσφορά
          </a>
        </div>

        <div className="flex flex-1 basis-[200px] flex-col gap-2.5 text-sm">
          <div className="mb-1 font-medium">Επικοινωνία</div>
          <div className="text-wood">info@charaxis.gr</div>
          <div className="text-wood">[τηλέφωνο επικοινωνίας]</div>
        </div>
      </div>
      <div className="border-t border-line px-6 py-5 text-center text-[12.5px] text-faint md:px-16">
        © {new Date().getFullYear()} Charaxis. Όλα τα δικαιώματα κατοχυρωμένα.
      </div>
    </footer>
  );
}
