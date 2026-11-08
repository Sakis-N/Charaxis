import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <section className="flex flex-col items-start gap-5 px-6 py-24 md:px-16">
        <div className="text-sm text-wood">404</div>
        <h1 className="text-[32px] font-medium">Αυτή η σελίδα δεν βρέθηκε</h1>
        <p className="max-w-md font-serif text-wood">Ίσως ο σύνδεσμος να άλλαξε. Δες τα προϊόντα μας ή γύρνα στην αρχική.</p>
        <div className="flex gap-4">
          <Link href="/proionta" className="bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors hover:bg-ember">Προϊόντα</Link>
          <Link href="/" className="border border-ink px-7 py-3 text-sm font-medium transition-colors hover:border-ember hover:text-ember">Αρχική</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
