import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import EngraveShowcase from "@/components/EngraveShowcase";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Testimonial from "@/components/Testimonial";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <Hero />
      <HowItWorks />
      <EngraveShowcase />
      <Categories />
      <FeaturedProducts />
      <Testimonial />
      <Footer />
    </main>
  );
}
