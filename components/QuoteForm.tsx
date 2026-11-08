"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";

const input =
  "w-full border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink";

export default function QuoteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [refPath, setRefPath] = useState<string | null>(null);
  const [refName, setRefName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) { setRefPath(null); setRefName(""); return; }
    if (file.size > 15 * 1024 * 1024) { setError("Η φωτογραφία είναι πολύ μεγάλη (μέγιστο 15MB)."); return; }
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `quotes/${crypto.randomUUID()}.${ext}`;
    const { error: err } = await supabase.storage.from("customer-uploads").upload(path, file, { contentType: file.type || undefined });
    setUploading(false);
    if (err) { setError("Δεν ανέβηκε η φωτογραφία. Δοκίμασε ξανά."); return; }
    setRefPath(path);
    setRefName(file.name);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState("busy");
    const { data, error: err } = await supabase.rpc("submit_quote", {
      p_name: name, p_email: email, p_phone: phone, p_description: description, p_reference: refPath,
    });
    if (err) { setError(err.message); setState("idle"); return; }
    fetch("/api/notify/form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "quote", id: data }),
      keepalive: true,
    }).catch(() => {});
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="border border-ink p-6">
        <b>Το αίτημά σου στάλθηκε ✓</b>
        <p className="mt-1 font-serif text-wood">Θα δούμε την ιδέα σου και θα σου στείλουμε προσφορά στο {email}.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
      <input required className={input} placeholder="Ονοματεπώνυμο" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input required type="email" className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
        <input type="tel" className={input} placeholder="Τηλέφωνο (προαιρετικό)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
      </div>
      <textarea required rows={6} className={input} placeholder="Τι θέλεις να φτιάξουμε; Γράψε υλικό, διαστάσεις, ποσότητα, πότε το χρειάζεσαι…" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
      <div className="flex flex-col gap-2">
        <label className="flex w-fit cursor-pointer items-center gap-3 border border-line px-5 py-2.5 text-sm transition-colors duration-200 hover:border-ink">
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          {uploading ? "Ανεβαίνει…" : refName ? "Αλλαγή φωτογραφίας" : "Φωτογραφία αναφοράς (προαιρετικό)"}
        </label>
        {refName && <span className="text-xs text-wood">{refName}</span>}
      </div>
      {error && <p className="text-sm text-ember-dark">{error}</p>}
      <button type="submit" disabled={state === "busy" || uploading} className="w-fit bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember disabled:opacity-50">
        {state === "busy" ? "Αποστολή…" : "Ζήτα προσφορά"}
      </button>
    </form>
  );
}
