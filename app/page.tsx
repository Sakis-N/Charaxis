import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import QuoteBand from "@/components/QuoteBand";
import Footer from "@/components/Footer";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

export default function HomePage() {
  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <Hero />
      <HowItWorks />
      <Categories />
      <FeaturedProducts />
      <QuoteBand />
      <Footer />
    </main>
  );
}
