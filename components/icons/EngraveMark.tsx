// Ένα ξύλινο μπρελόκ (tag) με τρύπα ανάρτησης σχεδιάζεται σαν να το
// χαράσσει το λέιζερ, και μετά "ανάβει" η χαραγμένη καρδιά μέσα του.
// Καθαρό CSS animation (καμία JS) — δουλεύει και ως Server Component.
export default function EngraveMark() {
  return (
    <svg
      viewBox="28 34 144 124"
      className="h-auto w-[72%] max-w-[420px] transition-transform duration-500 ease-out group-hover:-rotate-3 group-hover:scale-105"
      aria-hidden="true"
    >
      <g transform="rotate(-6 100 100)">
        <rect
          x="42"
          y="48"
          width="116"
          height="96"
          rx="14"
          fill="none"
          stroke="#1B1714"
          strokeWidth="2.2"
          pathLength={1}
          strokeDasharray="1"
          className="engrave-path"
        />
        <circle
          cx="64"
          cy="66"
          r="6.5"
          fill="none"
          stroke="#1B1714"
          strokeWidth="2.2"
          pathLength={1}
          strokeDasharray="1"
          className="engrave-path"
        />
      </g>

      <g className="origin-center [transform-box:fill-box] transition-transform duration-300 ease-out group-hover:scale-125">
      <path
        d="M100 134 C86 120, 74 111, 74 99 C74 89, 82 82, 91 85 C96 87, 99 90, 100 96 C101 90, 104 87, 109 85 C118 82, 126 89, 126 99 C126 111, 114 120, 100 134 Z"
        fill="none"
        stroke="#E2430F"
        strokeWidth="2.2"
        pathLength={1}
        strokeDasharray="1"
        className="engrave-path engrave-path--detail"
      />
      <path
        d="M100 134 C86 120, 74 111, 74 99 C74 89, 82 82, 91 85 C96 87, 99 90, 100 96 C101 90, 104 87, 109 85 C118 82, 126 89, 126 99 C126 111, 114 120, 100 134 Z"
        fill="#E2430F"
        className="engrave-fill"
      />
      </g>
    </svg>
  );
}
