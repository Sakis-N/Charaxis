import Image from "next/image";
import Link from "next/link";
import { SALE, saleActive } from "@/lib/sale";

// Banner προσφοράς στην κορυφή της αρχικής. Εμφανίζεται μόνο όσο τρέχει η προσφορά
// (lib/sale.ts)· η σελίδα ανανεώνεται κάθε λεπτό, οπότε κρύβεται μόνο του όταν λήξει.
export default function SaleBanner() {
  if (!saleActive()) return null;
  const alt = `${SALE.name}: -${SALE.percent}% σε όλο το site, ${SALE.datesLabel}`;
  return (
    // Πάνω κενό: εκεί κρέμονται τα χριστουγεννιάτικα λαμπάκια (public/christmas.js) χωρίς να κρύβουν το banner.
    <section className="bg-[#070605] pt-14 md:pt-16">
      <Link href="/proionta" aria-label={`${alt}. Δες όλα τα προϊόντα`} className="group relative block overflow-hidden">
        {/* κινητό: τετράγωνο */}
        <Image
          src="/brand/blackfriday-square.webp"
          alt={alt}
          width={1200}
          height={1200}
          priority
          sizes="100vw"
          className="block h-auto w-full md:hidden"
        />
        {/* tablet/desktop: φαρδύ */}
        <Image
          src="/brand/blackfriday-wide.webp"
          alt={alt}
          width={2400}
          height={875}
          priority
          sizes="100vw"
          className="hidden h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.01] md:block"
        />
        <span className="flex justify-center pb-5 pt-1 md:absolute md:bottom-[7%] md:right-[22%] md:p-0">
          <span className="whitespace-nowrap rounded-full bg-[#E2430F] px-6 py-2.5 text-[14px] font-semibold text-white shadow-lg ring-2 ring-[#F7C95B]/70 transition-colors duration-200 group-hover:bg-[#F7C95B] group-hover:text-ink md:text-[15px]">
            Ψώνισε τώρα →
          </span>
        </span>
      </Link>
    </section>
  );
}
