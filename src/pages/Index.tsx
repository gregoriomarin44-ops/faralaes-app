import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Catalog } from "@/components/Catalog";
import { Trust } from "@/components/Trust";
import { BuyerForm } from "@/components/BuyerForm";
import { ForShops } from "@/components/ForShops";
import { Footer } from "@/components/Footer";

const Index = () => (
  <main className="min-h-screen bg-background">
    <Hero />
    <HowItWorks />
    <Catalog />
    <Trust />
    <section id="vender" className="py-16 md:py-28 bg-background">
      <div className="container text-center">
        <a href="/auth" className="inline-flex items-center justify-center px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium shadow-coral hover:bg-primary-deep transition-smooth">
          Publicar prenda
        </a>
      </div>
    </section>
    <BuyerForm />
    <ForShops />
    <Footer />
  </main>
);

export default Index;
