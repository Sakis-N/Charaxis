import { PRODUCTION_TIME } from "@/lib/business";

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-ember">
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Μικρά σήματα εμπιστοσύνης κάτω από την τιμή του προϊόντος.
export default function TrustBadges() {
  const items = [
    {
      d: "M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4l-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3z",
      t: "Χειροποίητο, ένα-ένα",
      s: `Παραγωγή σε ${PRODUCTION_TIME}`,
    },
    {
      d: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
      t: "Αποστολή σε όλη την Ελλάδα",
      s: "ACS, BoxNow ή Skroutz Point",
    },
    {
      d: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4",
      t: "Ασφαλής παραγγελία",
      s: "Βλέπεις την πορεία της online",
    },
  ];
  return (
    <ul className="grid grid-cols-1 gap-3 border-y border-line py-4 sm:grid-cols-3">
      {items.map((i) => (
        <li key={i.t} className="flex gap-2.5">
          <Icon d={i.d} />
          <span className="flex flex-col">
            <span className="text-[13px] font-medium leading-snug">{i.t}</span>
            <span className="text-[12px] leading-snug text-wood">{i.s}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
