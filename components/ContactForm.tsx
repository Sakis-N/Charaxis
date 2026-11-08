"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";

const input =
  "w-full border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-ink";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState("busy");
    const { data, error: err } = await supabase.rpc("submit_contact", {
      p_name: name,
      p_email: email,
      p_message: message,
    });
    if (err) {
      setError(err.message);
      setState("idle");
      return;
    }
    fetch("/api/notify/form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contact", id: data }),
      keepalive: true,
    }).catch(() => {});
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="border border-ink p-6">
        <b>Ευχαριστούμε!</b>
        <p className="mt-1 font-serif text-wood">Λάβαμε το μήνυμά σου και θα απαντήσουμε στο {email} το συντομότερο.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
      <input required className={input} placeholder="Ονοματεπώνυμο" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      <input required type="email" className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
      <textarea required rows={6} className={input} placeholder="Το μήνυμά σου" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={3000} />
      {error && <p className="text-sm text-ember-dark">{error}</p>}
      <button type="submit" disabled={state === "busy"} className="w-fit bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ember disabled:opacity-50">
        {state === "busy" ? "Αποστολή…" : "Αποστολή μηνύματος"}
      </button>
    </form>
  );
}
