"use client";

type Props = {
  lines: string[];
  photo?: string | null; // data URL της φωτογραφίας που ανέβασε ο πελάτης
  placeholder?: string;
};

const BURN = "#3A2414";

// Κάθε χαρακτήρας έχει σταθερό key (θέση), οπότε μόνο οι καινούριοι
// χαρακτήρες "καίγονται" όταν γράφει ο πελάτης — οι παλιοί μένουν ως έχουν.
function BurnLine({ text }: { text: string }) {
  return (
    <span className="block">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="burn-char">
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

function fitClass(lines: string[]) {
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  const rows = lines.length;
  if (rows >= 7 || longest > 34) return "text-[12px] md:text-[13px]";
  if (rows >= 5 || longest > 22) return "text-[15px] md:text-[17px]";
  if (rows >= 4 || longest > 12) return "text-[20px] md:text-[24px]";
  return "text-[28px] md:text-[34px]";
}

// Ζωντανή προεπισκόπηση της χάραξης σε "ξύλινο" πάνελ: ό,τι γράφει ο
// πελάτης εμφανίζεται σαν να το καίει το λέιζερ, και η φωτογραφία του
// παίρνει τόνο χάραξης. Ενδεικτική — η τελική διάταξη γίνεται στο εργαστήριο.
export default function EngravePreview({ lines, photo, placeholder = "Το κείμενό σου εδώ" }: Props) {
  const shown = lines.map((l) => l.trim()).filter(Boolean).slice(0, 8);
  const empty = shown.length === 0 && !photo;

  return (
    <figure className="flex flex-col gap-2">
      <div className="wood-panel relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-line p-6">
        <div
          className={`flex h-full w-full flex-col items-center justify-center gap-2 text-center font-serif leading-snug ${fitClass(shown)}`}
          style={{ ["--burn-final" as string]: BURN, color: BURN }}
        >
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Η φωτογραφία σου, όπως θα χαραχτεί"
              className="max-h-[55%] max-w-[80%] object-contain mix-blend-multiply"
              style={{ filter: "grayscale(1) sepia(0.85) contrast(1.35) brightness(0.92)" }}
            />
          )}
          {empty ? (
            <span className="italic opacity-40">{placeholder}</span>
          ) : (
            shown.map((l, i) => <BurnLine key={i} text={l} />)
          )}
        </div>
      </div>
      <figcaption className="text-[12px] text-faint">
        Ενδεικτική προεπισκόπηση. Την τελική διάταξη τη στήνουμε εμείς στο εργαστήριο.
      </figcaption>
    </figure>
  );
}
