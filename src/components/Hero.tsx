import { ArrowRight, Sparkles } from "lucide-react";

const heroImg = "/hero-flamenca.webp";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-cream">
      <div className="container py-12 md:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="animate-fade-up order-2 md:order-1">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Publica tu traje de flamenca GRATIS
          </span>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-foreground text-balance mb-6">
            Compra y vende ropa flamenca <em className="text-primary not-italic md:italic">sin complicarte</em>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl text-balance">
            Sube tu prenda en menos de 1 minuto y llega a miles de personas interesadas
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/auth" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium shadow-coral hover:bg-primary-deep transition-smooth">
              Publicar prenda gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-smooth" />
            </a>
            <a href="#catalogo" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-foreground text-background font-medium hover:bg-foreground/85 transition-smooth">
              Quiero ver el catálogo
            </a>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-10 pt-8 border-t border-border/60">
            <div>
              <div className="font-serif text-xl md:text-2xl text-foreground">Nuevos anuncios cada día</div>
            </div>
            <div>
              <div className="font-serif text-xl md:text-2xl text-foreground">Contacto directo con el vendedor</div>
            </div>
          </div>
        </div>

        <div className="relative order-1 md:order-2">
          <div className="absolute -inset-4 bg-gradient-coral opacity-20 blur-3xl rounded-full" />
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-soft">
            <img src={heroImg} alt="Traje de flamenca granate con lunares blancos" width={1080} height={1350} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};
