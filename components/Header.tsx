import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5 md:px-16">
      <Link href="/" className="font-display text-2xl font-semibold tracking-wide">
        CHARAXIS
      </Link>

      <nav className="flex flex-wrap gap-9 text-[15px] font-medium">
        <Link href="#categories">Κατηγορίες</Link>
        <Link href="#custom">Φτιάξε το δικό σου</Link>
        <Link href="#about">Για εμάς</Link>
        <Link href="#contact">Επικοινωνία</Link>
      </nav>

      <div className="flex items-center gap-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="#2A2420" strokeWidth="1.6" />
          <path
            d="M20 20L16.5 16.5"
            stroke="#2A2420"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <button
          aria-label="Καλάθι"
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 4h2l2.4 12.6a2 2 0 002 1.4h8.2a2 2 0 002-1.6L21 8H6"
              stroke="#FFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="21" r="1.4" fill="#FFF" />
            <circle cx="18" cy="21" r="1.4" fill="#FFF" />
          </svg>
          Καλάθι
        </button>
      </div>
    </header>
  );
}
