// Χαραγμένα σχέδια στις γωνίες του πάνελ (δώρο, δέντρο, κάδρο, στολίδι),
// όπως τα εικονίδια του λογοτύπου. Σχεδιάζονται διαδοχικά σαν να τα καίει
// το λέιζερ και ανάβουν πορτοκαλί στο hover.
const common = {
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  pathLength: 1,
  strokeDasharray: "1",
};
const cls = "engrave-path stroke-wood transition-colors duration-300 group-hover:stroke-ember";

function Doodle({ d, delay }: { d: string; delay: number }) {
  return <path d={d} {...common} className={cls} style={{ animationDelay: `${delay}s` }} />;
}

export default function PanelDoodles() {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* Δώρο */}
      <Doodle delay={2.0} d="M36 70 H88 V58 H36 Z M40 70 V102 H84 V70 M62 58 V102" />
      <Doodle delay={2.3} d="M62 58 C50 38, 34 52, 62 58 C90 52, 74 38, 62 58" />
      {/* Χριστουγεννιάτικο δέντρο */}
      <Doodle delay={2.6} d="M340 28 L322 62 H332 L316 90 H364 L348 62 H358 Z M340 90 V104" />
      {/* Κάδρο με τοπίο */}
      <Doodle delay={2.9} d="M36 200 H92 V246 H36 Z M42 238 L58 218 L70 232 L78 224 L88 238" />
      <Doodle delay={3.1} d="M76 212 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
      {/* Στολίδι */}
      <Doodle delay={3.3} d="M322 232 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0" />
      <Doodle delay={3.5} d="M322 208 V198 M316 214 H328 M322 222 L328 232 L322 242 L316 232 Z" />
      {/* Σπίθες */}
      <Doodle delay={3.7} d="M150 36 V50 M143 43 H157" />
      <Doodle delay={3.85} d="M262 264 V276 M256 270 H268" />
      <Doodle delay={4.0} d="M120 262 V272 M115 267 H125" />
      <Doodle delay={4.15} d="M286 52 V62 M281 57 H291" />
    </svg>
  );
}
