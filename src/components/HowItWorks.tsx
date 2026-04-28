import { ClipboardList, ShieldCheck, Heart } from "lucide-react";

const steps = [
  { n: "01", icon: ClipboardList, title: "Subes tu prenda", desc: "Rellenas un formulario sencillo con fotos, talla, estado y precio. En 2 minutos." },
  { n: "02", icon: ShieldCheck, title: "Revisamos y publicamos", desc: "Verificamos cada anuncio a mano para que solo se publique moda flamenca real y de calidad." },
  { n: "03", icon: Heart, title: "Te avisamos del interés", desc: "Cuando alguien quiera tu prenda, te lo notificamos por WhatsApp o email. Tú cierras la venta." },
];

export const HowItWorks = () => (
  <section id="como-funciona" className="py-16 md:py-28 bg-background">
    <div className="container">
      <div className="max-w-2xl mx-auto text-center mb-14 md:mb-20">
        <span className="text-primary text-sm font-medium uppercase tracking-widest">Cómo funciona</span>
        <h2 className="font-serif text-3xl md:text-5xl mt-3 mb-4 text-balance">
          Tres pasos para dar nueva vida a tu traje
        </h2>
        <p className="text-muted-foreground text-balance">
          Sin comisiones ocultas, sin complicaciones técnicas. Lo gestionamos todo de forma manual y cercana.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {steps.map((s) => (
          <div key={s.n} className="relative bg-card rounded-2xl p-8 border border-border/60 hover:shadow-soft transition-smooth">
            <div className="absolute top-6 right-6 font-serif text-5xl text-primary/15">{s.n}</div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-serif text-2xl mb-2">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
