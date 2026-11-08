"use client";

import { useState, type ChangeEvent } from "react";

export type CustomField = {
  id: string;
  type: "text" | "textarea" | "photo" | "select" | "toggle_text";
  label: string;
  description?: string;
  placeholder?: string;
  hint?: string;
  options?: string[]; // για type: "select"
  toggle_yes?: string; // για type: "toggle_text"
  toggle_no?: string;
};

type Props = {
  productName: string;
  basePrice: number | null;
  fields: CustomField[];
};

type Values = Record<string, string | boolean>;

export default function ProductCustomizer({ productName, basePrice, fields }: Props) {
  const [values, setValues] = useState<Values>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function setValue(id: string, v: string | boolean) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function handlePhoto(id: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setValue(id, file.name);
    } else {
      setPhotoPreview(null);
      setValue(id, "");
    }
  }

  // Ένα toggle_text πεδίο με "Ναι" μπλοκάρει το submit μέχρι να συμπληρωθεί το link.
  const blockedToggle = fields.find(
    (f) => f.type === "toggle_text" && values[f.id] === true && !String(values[`${f.id}_value`] || "").trim()
  );
  const canAdd = !blockedToggle;

  return (
    <div className="flex flex-col gap-8 border border-line bg-paper p-6 md:p-8">
      <h2 className="text-xl font-semibold">Προσαρμόσε το σχέδιο</h2>

      {fields.map((field, idx) => (
        <div key={field.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink text-xs">
              {idx + 1}
            </span>
            <span className="font-medium">{field.label}</span>
          </div>
          {field.description && (
            <p className="pl-[34px] font-serif text-sm text-wood">{field.description}</p>
          )}

          <div className="pl-[34px]">
            {field.type === "text" && (
              <input
                type="text"
                value={(values[field.id] as string) || ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full max-w-md border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink"
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={(values[field.id] as string) || ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                rows={4}
                placeholder={field.placeholder}
                className="w-full max-w-md border border-line bg-paper px-4 py-3 text-sm leading-relaxed outline-none transition-colors duration-200 focus:border-ink"
              />
            )}

            {field.type === "select" && (
              <div className="flex flex-wrap gap-3">
                {(field.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setValue(field.id, opt)}
                    className={`border px-5 py-2 text-sm transition-colors duration-200 ${
                      values[field.id] === opt
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {field.type === "photo" && (
              <>
                <label className="flex w-fit cursor-pointer items-center gap-3 border border-line px-5 py-2.5 text-sm transition-colors duration-200 hover:border-ink">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhoto(field.id, e)}
                    className="hidden"
                  />
                  {values[field.id] ? "Αλλαγή φωτογραφίας" : "Ανέβασε φωτογραφία"}
                </label>
                {photoPreview && (
                  <div className="relative mt-3 h-28 w-28 overflow-hidden border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Προεπισκόπηση" className="h-full w-full object-cover" />
                  </div>
                )}
              </>
            )}

            {field.type === "toggle_text" && (
              <>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue(field.id, true)}
                    className={`border px-5 py-2 text-sm transition-colors duration-200 ${
                      values[field.id] === true
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink"
                    }`}
                  >
                    {field.toggle_yes || "Ναι"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(field.id, false);
                      setValue(`${field.id}_value`, "");
                    }}
                    className={`border px-5 py-2 text-sm transition-colors duration-200 ${
                      values[field.id] === false
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink"
                    }`}
                  >
                    {field.toggle_no || "Όχι"}
                  </button>
                </div>
                {values[field.id] === true && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={(values[`${field.id}_value`] as string) || ""}
                      onChange={(e) => setValue(`${field.id}_value`, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full max-w-md border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink"
                    />
                    {field.hint && (
                      <p className="mt-1.5 text-xs text-faint">{field.hint}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <div className="text-lg font-medium text-ember">
          {basePrice ? `${basePrice.toFixed(2)} €` : "[ΤΙΜΗ]"}
        </div>
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => setAdded(true)}
          className="bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
        >
          {added ? "Προστέθηκε ✓" : "Προσθήκη στο καλάθι"}
        </button>
      </div>
      {blockedToggle && (
        <p className="-mt-4 text-xs text-ember-dark">
          Συμπλήρωσε το πεδίο για «{blockedToggle.label}» για να συνεχίσεις.
        </p>
      )}
      {added && (
        <p className="-mt-4 font-serif text-sm text-wood">
          Το «{productName}» προστέθηκε με τις επιλογές σου. Το καλάθι και η
          πληρωμή είναι το επόμενο κομμάτι που φτιάχνουμε.
        </p>
      )}
    </div>
  );
}
