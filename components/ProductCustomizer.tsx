"use client";

import { useState, type ChangeEvent } from "react";

type Props = {
  productName: string;
  basePrice: number | null;
};

export default function ProductCustomizer({ productName, basePrice }: Props) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [wantsQr, setWantsQr] = useState<boolean | null>(null);
  const [spotifyLink, setSpotifyLink] = useState("");
  const [added, setAdded] = useState(false);

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  const qrReady = wantsQr === false || (wantsQr === true && spotifyLink.trim().length > 0);
  const canAdd = qrReady;

  return (
    <div className="flex flex-col gap-8 rounded-2xl border border-border bg-white/60 p-6 md:p-8">
      <h2 className="text-xl font-semibold">Προσαρμόσε το σχέδιο</h2>

      {/* Βήμα 1 — φωτογραφία */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            1
          </span>
          <span className="font-semibold">Θες να χαράξουμε φωτογραφία;</span>
        </div>
        <p className="pl-[34px] text-sm text-muted">
          Προαιρετικό. Ανέβασε μια φωτογραφία αν θες να συμπεριληφθεί στη χάραξη —
          αλλιώς προχώρα χωρίς.
        </p>
        <div className="pl-[34px]">
          <label className="flex w-fit cursor-pointer items-center gap-3 rounded-full border border-border bg-bg px-5 py-2.5 text-sm font-medium transition-colors duration-200 hover:border-accent hover:text-accent">
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {photoFile ? "Αλλαγή φωτογραφίας" : "Ανέβασε φωτογραφία"}
          </label>
          {photoPreview && (
            <div className="relative mt-3 h-28 w-28 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Προεπισκόπηση" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Βήμα 2 — στίχοι / κείμενο */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            2
          </span>
          <span className="font-semibold">Στίχοι ή κείμενο</span>
        </div>
        <p className="pl-[34px] text-sm text-muted">
          Γράψε ακριβώς το κείμενο που θες χαραγμένο — στίχοι, αφιέρωση, τίτλος
          τραγουδιού κ.λπ.
        </p>
        <div className="pl-[34px]">
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={4}
            placeholder={`π.χ.\n"Μ' αρέσει το σπίτι που φτιάξαμε"\nMiami 2 - Bloody Hawk`}
            className="w-full max-w-md rounded-xl border border-border bg-bg px-4 py-3 text-sm leading-relaxed outline-none transition-colors duration-200 focus:border-accent"
          />
        </div>
      </div>

      {/* Βήμα 3 — Spotify QR */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            3
          </span>
          <span className="font-semibold">Θες QR code από Spotify;</span>
        </div>
        <p className="pl-[34px] text-sm text-muted">
          Σκαναρίσιμος κωδικός που ανοίγει το τραγούδι σου στο Spotify.
        </p>
        <div className="flex gap-3 pl-[34px]">
          <button
            type="button"
            onClick={() => setWantsQr(true)}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors duration-200 ${
              wantsQr === true
                ? "border-accent bg-accent text-white"
                : "border-border bg-bg hover:border-accent"
            }`}
          >
            Ναι, θέλω QR
          </button>
          <button
            type="button"
            onClick={() => {
              setWantsQr(false);
              setSpotifyLink("");
            }}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors duration-200 ${
              wantsQr === false
                ? "border-accent bg-accent text-white"
                : "border-border bg-bg hover:border-accent"
            }`}
          >
            Όχι, χωρίς QR
          </button>
        </div>
        {wantsQr && (
          <div className="pl-[34px]">
            <input
              type="url"
              value={spotifyLink}
              onChange={(e) => setSpotifyLink(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              className="w-full max-w-md rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-accent"
            />
            <p className="mt-1.5 text-xs text-faint">
              Άνοιξε το Spotify → Μοιρασμός → Αντιγραφή συνδέσμου τραγουδιού, και
              κάνε paste εδώ.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <div className="text-lg font-semibold text-accent">
          {basePrice ? `${basePrice.toFixed(2)} €` : "[ΤΙΜΗ]"}
        </div>
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => setAdded(true)}
          className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {added ? "Προστέθηκε ✓" : "Προσθήκη στο καλάθι"}
        </button>
      </div>
      {wantsQr === true && spotifyLink.trim().length === 0 && (
        <p className="-mt-4 text-xs text-accent-dark">
          Πρόσθεσε τον σύνδεσμο Spotify για να συνεχίσεις.
        </p>
      )}
      {added && (
        <p className="-mt-4 text-sm text-muted">
          Το «{productName}» προστέθηκε με τις επιλογές σου. Το καλάθι και η
          πληρωμή είναι το επόμενο κομμάτι που φτιάχνουμε.
        </p>
      )}
    </div>
  );
}
