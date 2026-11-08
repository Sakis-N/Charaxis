export default function Testimonial() {
  return (
    <section className="flex flex-col items-start gap-5 bg-ink px-6 py-16 text-paper md:px-16">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 11c0-3 2-5 5-5v2c-1.8 0-3 1.2-3 3h3v6H7v-6zm9 0c0-3 2-5 5-5v2c-1.8 0-3 1.2-3 3h3v6h-5v-6z"
          fill="#E2430F"
        />
      </svg>
      <p className="max-w-[640px] font-serif text-[21px] italic leading-relaxed">
        [Σύντομο σχόλιο πελάτη για ένα χειροποίητο δώρο — θα μπει πραγματικό
        review εδώ]
      </p>
      <div className="text-[13.5px] text-paper/60">— Πελάτης Charaxis</div>
    </section>
  );
}
