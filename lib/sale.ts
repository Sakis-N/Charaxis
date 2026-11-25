// Έκπτωση σε όλο το site για συγκεκριμένο διάστημα (π.χ. Black Friday).
//
// Η ΤΕΛΙΚΗ τιμή υπολογίζεται ΠΑΝΤΑ στη βάση (public.sale_percent() μέσα στο create_order),
// από τη ρύθμιση shop_settings.key = 'sale'. Τα παρακάτω πρέπει να συμφωνούν με αυτή
// τη ρύθμιση· το site τα χρησιμοποιεί μόνο για να δείχνει τις τιμές.
// Η έκπτωση εφαρμόζεται στην τιμή ανά τεμάχιο και στρογγυλεύεται στο λεπτό,
// όπως και στη βάση.

export const SALE = {
  name: "Black Friday",
  percent: 40,
  startsAt: "2026-11-25T00:00:00+02:00",
  endsAt: "2026-12-01T00:00:00+02:00", // αποκλειστικό: η προσφορά ισχύει έως 30/11 23:59
  datesLabel: "25 – 30 Νοεμβρίου",
};

export function salePercent(now: Date = new Date()): number {
  const t = now.getTime();
  return t >= Date.parse(SALE.startsAt) && t < Date.parse(SALE.endsAt) ? SALE.percent : 0;
}

export const saleActive = (now?: Date) => salePercent(now) > 0;

// Τιμή μετά την έκπτωση (ανά τεμάχιο, στρογγυλεμένη στο λεπτό).
export function salePrice(price: number, pct: number = salePercent()): number {
  if (!pct) return price;
  return Math.round(price * (100 - pct)) / 100;
}
