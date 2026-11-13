"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";
import { flyToCart } from "@/components/flyToCart";
import { SIDE_CHOICES, rangeLabel, tierPrice, tiersFor, variantKey, type Pricing } from "@/lib/pricing";

export type CustomField = {
  id: string;
  type: "text" | "textarea" | "photo" | "select" | "toggle_text" | "side";
  label: string;
  description?: string;
  placeholder?: string;
  hint?: string;
  options?: string[]; // για type: "select"
  toggle_yes?: string; // για type: "toggle_text"
  toggle_no?: string;
};

type Props = {
  productId: string;
  slug: string;
  image: string | null;
  productName: string;
  basePrice: number | null;
  fields: CustomField[];
  pricing?: Pricing | null;
};

type Values = Record<string, string | boolean>;

export default function ProductCustomizer({ productId, slug, image, productName, basePrice, fields, pricing }: Props) {
  const cart = useCart();
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [values, setValues] = useState<Values>({});
  const [qtyText, setQtyText] = useState("1");
  const [added, setAdded] = useState(false);

  function setValue(id: string, v: string | boolean) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function clearFile(id: string) {
    setPhotos((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setFileNames((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setPreviews((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  }

  async function handlePhoto(id: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setUploadError(null);
    if (!file) {
      clearFile(id);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Το αρχείο είναι πολύ μεγάλο (μέγιστο 15MB).");
      return;
    }
    if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => setPreviews((p) => ({ ...p, [id]: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((p) => ({ ...p, [id]: null }));
    }
    setFileNames((p) => ({ ...p, [id]: file.name }));

    // Ανέβασμα αμέσως στον ιδιωτικό χώρο αποθήκευσης — ο πελάτης δεν χρειάζεται
    // να ξαναανεβάσει τίποτα στο checkout.
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("customer-uploads")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    setUploading(false);
    if (error) {
      setUploadError("Δεν ανέβηκε το αρχείο. Δοκίμασε ξανά.");
      clearFile(id);
      return;
    }
    setPhotos((p) => ({ ...p, [id]: path }));
  }

  // ---- Όψεις (λογότυπο / γράμματα) + κλιμακωτή τιμή ----
  const sides = fields.filter((f) => f.type === "side");
  const choiceOf = (f: CustomField) => (values[f.id] as string) || "none";
  const textOf = (f: CustomField) => String(values[`${f.id}_value`] || "").trim();
  const variant = sides.length ? variantKey(sides.map(choiceOf)) : null;
  const tiers = pricing && variant ? tiersFor(pricing, variant) : null;
  const qtyNum = Math.min(5000, Math.max(1, parseInt(qtyText, 10) || 1));
  const unit = tiers ? tierPrice(tiers, qtyNum) : pricing ? null : basePrice;

  let sideProblem: string | null = null;
  if (sides.length) {
    if (!variant) {
      sideProblem = "Διάλεξε τι θα χαραχτεί σε τουλάχιστον μία όψη.";
    } else {
      const noLogo = sides.find((f) => choiceOf(f) === "logo" && !photos[f.id]);
      const noText = sides.find((f) => choiceOf(f) === "text" && !textOf(f));
      if (noLogo) sideProblem = `Ανέβασε το λογότυπο για «${noLogo.label}».`;
      else if (noText) sideProblem = `Γράψε τα γράμματα για «${noText.label}».`;
    }
  }

  function addToCart(btn: HTMLElement) {
    const outFields = fields
      .filter((f) => f.type !== "photo")
      .map((f) => {
        let v = values[f.id];
        if (f.type === "toggle_text") {
          v = v === true ? `${f.toggle_yes || "Ναι"}: ${String(values[`${f.id}_value`] || "")}` : v === false ? f.toggle_no || "Όχι" : "";
        } else if (f.type === "side") {
          const c = choiceOf(f);
          v = c === "logo" ? "Λογότυπο (ανεβασμένο αρχείο)" : c === "text" ? `Γράμματα: ${textOf(f)}` : "Χωρίς χάραξη";
        }
        return { id: f.id, label: f.label, value: typeof v === "string" ? v : "" };
      })
      .filter((f) => f.value.trim() !== "");
    // Με τη σειρά των πεδίων (π.χ. μπροστά, μετά πίσω), όχι με τη σειρά ανεβάσματος.
    const outPhotos = fields.filter((f) => photos[f.id]).map((f) => ({ field: f.id, path: photos[f.id] }));
    cart.add({
      product_id: productId,
      slug,
      name: productName,
      image,
      price: unit ?? 0,
      quantity: qtyNum,
      tiers: tiers ?? null,
      custom_design: {
        fields: outFields,
        photos: outPhotos,
        ...(pricing && variant ? { variant } : {}),
      },
    });
    setAdded(true);
    flyToCart(btn);
  }

  // Ένα toggle_text πεδίο με "Ναι" μπλοκάρει το submit μέχρι να συμπληρωθεί το link.
  const blockedToggle = fields.find(
    (f) => f.type === "toggle_text" && values[f.id] === true && !String(values[`${f.id}_value`] || "").trim()
  );
  const missingPhoto = fields.find((f) => f.type === "photo" && !photos[f.id]);
  const canAdd = !blockedToggle && !uploading && !missingPhoto && !sideProblem && (!pricing || unit !== null);

  const choiceBtn = (active: boolean) =>
    `border px-5 py-2 text-sm transition-colors duration-200 ${
      active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
    }`;
  const inputCls =
    "w-full max-w-md border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink";

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
                className={inputCls}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={(values[field.id] as string) || ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                rows={4}
                placeholder={field.placeholder}
                className={`${inputCls} leading-relaxed`}
              />
            )}

            {field.type === "select" && (
              <div className="flex flex-wrap gap-3">
                {(field.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setValue(field.id, opt)}
                    className={choiceBtn(values[field.id] === opt)}
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
                  {fileNames[field.id] ? "Αλλαγή φωτογραφίας" : "Ανέβασε φωτογραφία"}
                </label>
                {previews[field.id] && (
                  <div className="relative mt-3 h-28 w-28 overflow-hidden border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previews[field.id] as string} alt="Προεπισκόπηση" className="h-full w-full object-cover" />
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
                    className={choiceBtn(values[field.id] === true)}
                  >
                    {field.toggle_yes || "Ναι"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(field.id, false);
                      setValue(`${field.id}_value`, "");
                    }}
                    className={choiceBtn(values[field.id] === false)}
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
                      className={inputCls}
                    />
                    {field.hint && (
                      <p className="mt-1.5 text-xs text-faint">{field.hint}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {field.type === "side" && (
              <>
                <div className="flex flex-wrap gap-3">
                  {SIDE_CHOICES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setValue(field.id, c.value);
                        if (c.value !== "logo") clearFile(field.id);
                        if (c.value !== "text") setValue(`${field.id}_value`, "");
                      }}
                      className={choiceBtn(choiceOf(field) === c.value)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {choiceOf(field) === "logo" && (
                  <div className="mt-3">
                    <label className="flex w-fit cursor-pointer items-center gap-3 border border-line px-5 py-2.5 text-sm transition-colors duration-200 hover:border-ink">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg,.ai,.eps"
                        onChange={(e) => handlePhoto(field.id, e)}
                        className="hidden"
                      />
                      {fileNames[field.id] ? "Αλλαγή λογότυπου" : "Ανέβασε το λογότυπό σου"}
                    </label>
                    <p className="mt-1.5 text-xs text-faint">
                      Κατά προτίμηση καθαρό αρχείο (PNG, SVG ή PDF) — αν χρειαστεί προσαρμογή, θα επικοινωνήσουμε μαζί σου.
                    </p>
                    {fileNames[field.id] && (
                      <div className="mt-3 flex items-center gap-3 text-sm text-wood">
                        {previews[field.id] && (
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-line">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previews[field.id] as string} alt="Προεπισκόπηση" className="h-full w-full object-contain" />
                          </div>
                        )}
                        <span className="break-all">{fileNames[field.id]}</span>
                      </div>
                    )}
                  </div>
                )}
                {choiceOf(field) === "text" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={(values[`${field.id}_value`] as string) || ""}
                      onChange={(e) => setValue(`${field.id}_value`, e.target.value)}
                      placeholder={field.placeholder || "π.χ. Καφέ Ηλιοτρόπιο"}
                      maxLength={60}
                      className={inputCls}
                    />
                    <p className="mt-1.5 text-xs text-faint">Γράψε ακριβώς το κείμενο που θες χαραγμένο.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {pricing && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink text-xs">
              {fields.length + 1}
            </span>
            <span className="font-medium">Ποσότητα (τεμάχια)</span>
          </div>
          <div className="pl-[34px]">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              value={qtyText}
              onChange={(e) => setQtyText(e.target.value)}
              onBlur={() => setQtyText(String(qtyNum))}
              className="w-32 border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink"
            />
            {tiers ? (
              <ul className="mt-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                {tiers.map(([min, pr], i) => {
                  const next = tiers[i + 1]?.[0];
                  const active = qtyNum >= min && (next === undefined || qtyNum < next);
                  return (
                    <li key={min} className={active ? "font-medium text-ember" : "text-wood"}>
                      {rangeLabel(tiers, i)}: {pr.toFixed(2)} €
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-faint">Διάλεξε τι θα χαραχτεί για να δεις τις τιμές ανά ποσότητα.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <div className="flex flex-col text-lg font-medium text-ember">
          {unit ? (
            pricing ? (
              <>
                <span>{(unit * qtyNum).toFixed(2)} €</span>
                <span className="text-xs font-normal text-wood">
                  {qtyNum} × {unit.toFixed(2)} € ανά τεμάχιο
                </span>
              </>
            ) : (
              `${unit.toFixed(2)} €`
            )
          ) : (
            ""
          )}
        </div>
        <button
          type="button"
          disabled={!canAdd}
          onClick={(e) => addToCart(e.currentTarget)}
          className="bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
        >
          {uploading ? "Ανεβαίνει το αρχείο…" : added ? "Προστέθηκε ✓ — πρόσθεσε κι άλλο" : "Προσθήκη στο καλάθι"}
        </button>
      </div>
      {blockedToggle && (
        <p className="-mt-4 text-xs text-ember-dark">
          Συμπλήρωσε το πεδίο για «{blockedToggle.label}» για να συνεχίσεις.
        </p>
      )}
      {sideProblem && !uploading && <p className="-mt-4 text-xs text-wood">{sideProblem}</p>}
      {missingPhoto && !uploading && (
        <p className="-mt-4 text-xs text-wood">Ανέβασε τη φωτογραφία «{missingPhoto.label}» για να προσθέσεις στο καλάθι.</p>
      )}
      {uploadError && <p className="-mt-4 text-xs text-ember-dark">{uploadError}</p>}
      {added && (
        <p className="-mt-4 font-serif text-sm text-wood">
          Το «{productName}» προστέθηκε με τις επιλογές σου.{" "}
          <Link href="/kalathi" className="text-ink underline underline-offset-2 hover:text-ember">
            Δες το καλάθι
          </Link>
        </p>
      )}
    </div>
  );
}
