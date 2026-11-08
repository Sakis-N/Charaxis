import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Κοινό περίβλημα για σελίδες κειμένου (νομικά, FAQ, πληροφορίες).
export default function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col overflow-x-hidden">
      <Header />
      <article className="flex max-w-3xl flex-col gap-6 px-6 py-12 md:px-16 md:py-16">
        <h1 className="text-[28px] font-medium md:text-[34px]">{title}</h1>
        {intro && <p className="font-serif text-[17px] leading-relaxed text-wood">{intro}</p>}
        <div className="flex flex-col gap-5 font-serif text-[15.5px] leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ember [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-medium [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </article>
      <Footer />
    </main>
  );
}
