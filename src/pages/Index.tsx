import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Catalog } from "@/components/Catalog";
import { SellForm } from "@/components/SellForm";
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
    <SellForm />
    <BuyerForm />
    <ForShops />
    <Footer />
  </main>
);

export default Index;
