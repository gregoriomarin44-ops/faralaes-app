import { ShieldCheck, MessageSquare, Eye, Sparkles } from "lucide-react";

const items = [
  { icon: Eye, title: "Revisión manual", desc: "Cada anuncio pasa por nuestras manos antes de publicarse." },
  { icon: MessageSquare, title: "Contacto directo", desc: "Hablas tú con la vendedora, sin intermediarios ni esperas." },
  { icon: ShieldCheck, title: "Sin anuncios falsos", desc: "Verificamos identidad y fotos para protegerte de fraudes." },
  { icon: Sparkles, title: "Solo moda flamenca", desc: "Especializadas en el sector. Conocemos los talleres y las tallas." },
];

export const Trust = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-primary text-sm font-medium uppercase tracking-widest">Confianza</span>
        <h2 className="font-serif text-3xl md:text-5xl mt-3 text-balance">Compra y vende con tranquilidad</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.map((it) => (
          <div key={it.title} className="bg-card border border-border/60 rounded-2xl p-5 md:p-7 hover:shadow-soft transition-smooth">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <it.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-serif text-xl mb-1.5">{it.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
