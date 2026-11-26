import { getSetting } from "./db";

const DEFAULT_JOB_TYPES = "Εγκατάσταση, Συντήρηση, Επισκευή, Αυτοψία, Βλάβη, Μελέτη, Πιστοποίηση, Παράδοση";
const DEFAULT_EXPENSE_CATS = "Υλικά, Καύσιμα, Διόδια, Εργαλεία, Υπεργολάβος, Μεταφορικά, Γραφείο, Άλλο";

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
export const jobTypes = () => list(getSetting("job_types") || DEFAULT_JOB_TYPES);
export const expenseCategories = () => list(getSetting("expense_categories") || DEFAULT_EXPENSE_CATS);
export { DEFAULT_JOB_TYPES, DEFAULT_EXPENSE_CATS };
