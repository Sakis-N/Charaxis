import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SaleBanner from "@/components/SaleBanner";
import Marquee from "@/components/Marquee";
import Categories from "@/components/Categories";
import GiftIdeas from "@/components/GiftIdeas";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowItWorks from "@/components/HowItWorks";
import QuoteBand from "@/components/QuoteBand";
import Footer from "@/components/Footer";

// Οι αλλαγές από το admin εμφανίζονται στο site μέσα σε ~1 λεπτό, χωρίς νέο deploy.
export const revalidate = 60;

export default function HomePage() {
  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <SaleBanner />
      <Hero />
      <Marquee />
      <Categories />
      <GiftIdeas />
      <FeaturedProducts />
      <HowItWorks />
      <QuoteBand />
      <Footer />
    </main>
  );
}
