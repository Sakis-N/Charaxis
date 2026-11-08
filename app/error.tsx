"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-col items-start gap-5 px-6 py-24 md:px-16">
      <h1 className="text-[28px] font-medium">Κάτι πήγε στραβά</h1>
      <p className="max-w-md font-serif text-wood">Δοκίμασε ξανά σε λίγο. Αν επιμένει, γράψε μας στη σελίδα επικοινωνίας.</p>
      <button onClick={reset} className="bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors hover:bg-ember">Δοκίμασε ξανά</button>
    </main>
  );
}
