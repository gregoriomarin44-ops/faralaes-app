import { FormEvent, useEffect, useState } from "react";
import { Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const conditionByLabel = {
  Nuevo: "new",
  "Como nuevo": "like_new",
  "Buen estado": "good",
} as const;

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const SellForm = () => {
  const [sent, setSent] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!data.get("privacidad")) {
      toast.error("Debes aceptar la política de privacidad");
      return;
    }

    if (files.length === 0) {
      toast.error("Selecciona al menos una foto de la prenda.");
      return;
    }

    if (files.length > MAX_IMAGES) {
      toast.error("Puedes subir como máximo 5 fotos.");
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      toast.error("Solo se permiten imágenes JPG, PNG o WebP.");
      return;
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_SIZE);
    if (oversized) {
      toast.error("Cada imagen debe pesar como máximo 10 MB.");
      return;
    }

    setSubmitting(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setSubmitting(false);
      toast.error("Inicia sesión para publicar una prenda.");
      return;
    }

    const title = String(data.get("titulo") || "").trim();
    const category = String(data.get("tipo") || "").trim();
    const rawDescription = String(data.get("descripcion") || "").trim();
    const description = rawDescription || `${category} en venta en Faralaes.`;
    const price = Number(data.get("precio"));
    const conditionLabel = String(data.get("estado") || "") as keyof typeof conditionByLabel;

    if (!conditionByLabel[conditionLabel]) {
      setSubmitting(false);
      toast.error("Selecciona un estado válido para la prenda.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setSubmitting(false);
      toast.error("Introduce un precio válido.");
      return;
    }

    const db = supabase as any;

    const { error: profileError } = await db.from("profiles").upsert(
      {
        id: userData.user.id,
        full_name: userData.user.user_metadata?.full_name ?? null,
        avatar_url: userData.user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      setSubmitting(false);
      toast.error(profileError.message);
      return;
    }

    const { data: listing, error } = await db.from("listings").insert({
      seller_id: userData.user.id,
      title,
      description,
      category,
      size: String(data.get("talla") || "").trim() || null,
      color: String(data.get("color") || "").trim() || null,
      condition: conditionByLabel[conditionLabel],
      price_cents: Math.round(price * 100),
      currency: "EUR",
      location: String(data.get("ubicacion") || "").trim() || null,
      shipping_available: data.get("shipping_available") === "on",
      whatsapp_contact_allowed: data.get("whatsapp_contact_allowed") === "on",
      status: "published",
    }).select("id").single();

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    const imageRows = [];

    for (const [index, file] of files.entries()) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const safeName = `${Date.now()}-${index}.${extension}`;
      const storagePath = `${userData.user.id}/${listing.id}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setSubmitting(false);
        toast.error(uploadError.message);
        return;
      }

      imageRows.push({
        listing_id: listing.id,
        storage_path: storagePath,
        alt_text: title,
        sort_order: index,
      });
    }

    const { error: imageError } = await db.from("listing_images").insert(imageRows);

    setSubmitting(false);

    if (imageError) {
      toast.error(imageError.message);
      return;
    }

    setSent(true);
    setPublishedListingId(listing.id);
    toast.success("Anuncio creado y publicado.");
  };


  return (
    <section id="vender" className="py-16 md:py-28 bg-background">
      <div className="container grid lg:grid-cols-5 gap-10 md:gap-16">
        <div className="lg:col-span-2">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Vender</span>
          <h2 className="font-serif text-3xl md:text-5xl mt-3 mb-5 text-balance">
            Cuéntanos qué prenda quieres vender
          </h2>
          <p className="text-muted-foreground mb-6">
            Rellena este formulario y nos pondremos en contacto contigo para revisar las fotos y publicar tu anuncio. Sin compromiso.
          </p>
          <ul className="space-y-3 text-sm">
            {["Sin comisiones durante la fase de validación", "Revisamos y mejoramos tu anuncio gratis", "Tú decides el precio y con quién hablas"].map((t) => (
              <li key={t} className="flex gap-3 items-start">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          {sent ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-soft">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl mb-2">¡Prenda publicada!</h3>
              <p className="text-muted-foreground mb-6">Tu anuncio ya está visible en Faralaes. Puedes verlo, editarlo o gestionarlo desde Mis anuncios.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {publishedListingId && (
                  <a href={`/producto/${publishedListingId}`} className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth">
                    Ver mi anuncio
                  </a>
                )}
                <a href="/mis-anuncios" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-primary transition-smooth">
                  Ir a Mis anuncios
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft space-y-4">
              <Field name="titulo" label="Título del anuncio" placeholder="Ej: Traje de flamenca rojo con lunares" required />
              <div className="grid md:grid-cols-2 gap-4">
                <Select name="tipo" label="Tipo de prenda" options={["Traje de flamenca", "Falda", "Blusa", "Mantón", "Flor", "Pendientes", "Zapatos", "Complemento"]} required />
                <Field name="talla" label="Talla" required />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Field name="color" label="Color" required />
                <Select name="estado" label="Estado" options={["Nuevo", "Como nuevo", "Buen estado"]} required />
                <Field name="precio" label="Precio (€)" type="number" required />
              </div>
              <Field name="ubicacion" label="Ubicación" placeholder="Sevilla, Jerez..." required />
              <label className="flex gap-3 items-start rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" name="shipping_available" className="mt-1 accent-primary" />
                <span>
                  <span className="block font-medium text-foreground">Envío disponible</span>
                  Puedo enviar la prenda si lo acuerdo con la compradora.
                </span>
              </label>
              <label className="flex gap-3 items-start rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" name="whatsapp_contact_allowed" className="mt-1 accent-primary" />
                <span>
                  <span className="block font-medium text-foreground">Permitir que usuarios registrados me contacten por WhatsApp</span>
                  Si no lo marcas, el anuncio solo mostrará mensajería interna.
                </span>
              </label>
              <div>
                <label className="text-sm font-medium block mb-1.5">Descripción</label>
                <textarea name="descripcion" rows={3} maxLength={500} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Cuéntanos detalles: año de confección, taller, retoques..." />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Fotos de la prenda</label>
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/60 transition-smooth">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {files.length === 1 ? files[0].name : files.length > 1 ? `${files.length} imágenes seleccionadas` : "Toca para subir hasta 5 fotos"}
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, MAX_IMAGES))} />
                </label>
                {files.length > 1 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.lastModified}`} className="truncate">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                )}
                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}`} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                        <img src={previewUrls[index]} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex gap-3 items-start text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" name="privacidad" className="mt-1 accent-primary" />
                <span>Acepto la <a href="/privacidad" className="text-primary underline">política de privacidad</a> y el tratamiento de mis datos para gestionar la venta.</span>
              </label>
              <button type="submit" disabled={submitting} className="w-full px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth shadow-coral disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Guardando..." : "Enviar mi prenda"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

const Field = ({ name, label, type = "text", required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) => (
  <div>
    <label className="text-sm font-medium block mb-1.5">{label}{required && " *"}</label>
    <input
      name={name}
      type={type}
      required={required}
      placeholder={placeholder}
      maxLength={150}
      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
    />
  </div>
);

const Select = ({ name, label, options, required }: { name: string; label: string; options: string[]; required?: boolean }) => (
  <div>
    <label className="text-sm font-medium block mb-1.5">{label}{required && " *"}</label>
    <select name={name} required={required} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
      <option value="">Selecciona...</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
