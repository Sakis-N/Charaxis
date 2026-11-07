import Link from "next/link";

const navLinks = [
  { href: "#categories", label: "Κατηγορίες" },
  { href: "#custom", label: "Φτιάξε το δικό σου" },
  { href: "#quote", label: "Ζήτα Προσφορά" },
  { href: "#contact", label: "Επικοινωνία" },
];

export default function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5 md:px-16">
      <Link
        href="/"
        className="font-display text-2xl font-semibold tracking-wide transition-colors duration-200 hover:text-accent"
      >
        CHARAXIS
      </Link>

      <nav className="flex flex-wrap gap-9 text-[15px] font-medium">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-accent after:transition-all after:duration-300 after:ease-out hover:after:w-full"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="cursor-pointer transition-transform duration-200 ease-out hover:scale-110"
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
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-md hover:shadow-accent/25"
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
