// Ζωντανή προεπισκόπηση: ό,τι γράφει ο πελάτης "χαράσσεται" γράμμα-γράμμα
// πάνω σε ξύλινη επιφάνεια. Τα keys είναι ανά θέση χαρακτήρα, οπότε μόνο
// ο νέος χαρακτήρας ξαναπαίζει την animation.
export default function EngravePreview({ lines }: { lines: string[] }) {
  const has = lines.length > 0;

  return (
    <div
      className="wood-panel flex min-h-[150px] flex-col items-center justify-center gap-1 rounded-sm px-6 py-8 text-center"
      aria-live="polite"
    >
      {has ? (
        lines.map((line, li) => (
          <div
            key={li}
            className="max-w-full whitespace-pre-wrap break-words font-serif text-[22px] leading-snug text-ink"
          >
            {Array.from(line).map((ch, i) => (
              <span key={i} className="burn-char">
                {ch}
              </span>
            ))}
          </div>
        ))
      ) : (
        <span className="font-serif text-[17px] italic text-faint">
          Γράψε κάτι παρακάτω και δες το να χαράσσεται εδώ
        </span>
      )}
    </div>
  );
}
