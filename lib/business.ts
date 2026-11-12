// Κεντρικά στοιχεία της επιχείρησης. Οι τιμές διαβάζονται από env vars ώστε
// να αλλάζουν από το Netlify χωρίς αλλαγή κώδικα. Ό,τι λείπει απλώς δεν
// εμφανίζεται (δεν μένουν ποτέ "[placeholders]" στο live site).
const env = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);

export const BUSINESS = {
  brand: "Charaxis",
  email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ?? "info@e-charaxis.gr",
  phone: env(process.env.NEXT_PUBLIC_PHONE),
  legalName: env(process.env.NEXT_PUBLIC_BUSINESS_NAME),
  afm: env(process.env.NEXT_PUBLIC_BUSINESS_AFM),
  doy: env(process.env.NEXT_PUBLIC_BUSINESS_DOY),
  address: env(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
  instagram: env(process.env.NEXT_PUBLIC_INSTAGRAM),
  facebook: env(process.env.NEXT_PUBLIC_FACEBOOK),
};

// Χρόνοι που αναφέρονται στις σελίδες πληροφοριών. Άλλαξέ τους εδώ αν
// δουλεύεις με διαφορετικούς ρυθμούς.
export const PRODUCTION_TIME = "2–5 εργάσιμες ημέρες";
export const DELIVERY_TIMES: Record<string, string> = {
  acs: "1–3 εργάσιμες ημέρες",
  boxnow: "1–3 εργάσιμες ημέρες",
  skroutz: "2–4 εργάσιμες ημέρες",
};

export const IRIS = {
  enabled: process.env.NEXT_PUBLIC_IRIS_ENABLED === "true",
  qr: "/iris-qr.png",
};

export const BANK = {
  iban: env(process.env.NEXT_PUBLIC_BANK_IBAN),
  name: env(process.env.NEXT_PUBLIC_BANK_NAME),
  holder: env(process.env.NEXT_PUBLIC_BANK_HOLDER),
};
