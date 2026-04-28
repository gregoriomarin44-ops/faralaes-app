import { FormEvent, useState } from "react";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { mailtoLink } from "@/lib/contact";

export const BuyerForm = () => {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const body = `Hola Faralaes, busco una prenda:

• Nombre: ${data.get("nombre")}
• Teléfono: ${data.get("telefono")}
• Qué busco: ${data.get("busca")}
• Talla: ${data.get("talla")}
• Presupuesto: ${data.get("presupuesto")} €
• Localidad: ${data.get("localidad")}

Gracias.`;

    window.location.href = mailtoLink(
      `[Faralaes] Búsqueda de prenda - ${data.get("nombre")}`,
      body
    );

    setSent(true);
    toast.success("Tomamos nota. Te avisamos cuando aparezca tu prenda ideal.");
  };


  return (
    <section id="comprar" className="py-16 md:py-28 bg-gradient-cream">
      <div className="container max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Buscas algo concreto</span>
          <h2 className="font-serif text-3xl md:text-5xl mt-3 text-balance">
            Dinos qué buscas y te lo encontramos
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            Si no ves la prenda perfecta en el catálogo, déjanos tus preferencias y te avisamos en cuanto entre algo a tu medida.
          </p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-soft">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-serif text-2xl mb-2">¡Anotado!</h3>
            <p className="text-muted-foreground">Cuando entre algo que encaje contigo, te escribimos.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input name="nombre" label="Nombre" required />
              <Input name="telefono" label="Teléfono" type="tel" required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">¿Qué buscas? *</label>
              <textarea name="busca" required rows={3} maxLength={400} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Ej: Traje de flamenca rojo con lunares blancos para la Feria de Abril" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="talla" label="Talla" required />
              <Input name="presupuesto" label="Presupuesto (€)" type="number" required />
              <Input name="localidad" label="Localidad" required />
            </div>
            <button type="submit" className="w-full px-6 py-3.5 rounded-full bg-foreground text-background font-medium hover:bg-foreground/85 transition-smooth">
              Avisarme cuando aparezca
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

const Input = ({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) => (
  <div>
    <label className="text-sm font-medium block mb-1.5">{label}{required && " *"}</label>
    <input name={name} type={type} required={required} maxLength={150} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
  </div>
);
