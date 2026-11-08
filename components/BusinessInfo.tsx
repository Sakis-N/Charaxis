import { BUSINESS } from "@/lib/business";

export default function BusinessInfo() {
  const rows: [string, string | null][] = [
    ["Επωνυμία", BUSINESS.legalName],
    ["ΑΦΜ", BUSINESS.afm],
    ["ΔΟΥ", BUSINESS.doy],
    ["Διεύθυνση", BUSINESS.address],
    ["Email", BUSINESS.email],
    ["Τηλέφωνο", BUSINESS.phone],
  ];
  return (
    <div className="flex flex-col gap-1 border border-line p-4 font-display text-sm">
      <b className="font-medium">Στοιχεία επιχείρησης</b>
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k}><span className="text-wood">{k}:</span> {v}</div>
      ))}
    </div>
  );
}
