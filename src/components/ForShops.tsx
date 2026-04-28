import { Store, ArrowRight } from "lucide-react";

export const ForShops = () => (
  <section id="tiendas" className="py-16 md:py-24 bg-foreground text-background">
    <div className="container">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex w-14 h-14 rounded-full bg-primary/20 items-center justify-center mb-6">
          <Store className="w-6 h-6 text-primary-glow" />
        </div>
        <h2 className="font-serif text-3xl md:text-5xl mb-5 text-balance">
          ¿Eres tienda, modista o profesional?
        </h2>
        <p className="text-background/70 text-lg mb-8 text-balance">
          Llega a cientos de flamencas que buscan piezas únicas. Te ayudamos a digitalizar tu catálogo y a conseguir clientas nuevas, sin pelear con webs ni redes sociales.
        </p>
        <a
          href="mailto:gregoriomarin44@gmail.com?subject=Quiero%20aparecer%20en%20Faralaes"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-smooth shadow-coral"
        >
          Quiero aparecer en Faralaes
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  </section>
);
