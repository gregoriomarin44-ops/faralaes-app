import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { supabase } from "@/integrations/supabase/client";
import { formatEuroFromCents, getDiscountPercent } from "@/lib/listingDisplay";

type ListingStatus = "draft" | "published" | "reserved" | "sold" | "archived" | "rejected" | "pending";

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type MyListing = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  original_price_cents: number | null;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  whatsapp_contact_allowed: boolean;
  condition: "new" | "like_new" | "good";
  status: ListingStatus;
  listing_images: ListingImage[];
  imageUrl?: string | null;
  imagePaths?: string[];
};

const conditionLabels: Record<MyListing["condition"], string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  good: "Buen estado",
};

const conditionOptions: Array<{ value: MyListing["condition"]; label: string }> = [
  { value: "new", label: "Nuevo" },
  { value: "like_new", label: "Como nuevo" },
  { value: "good", label: "Buen estado" },
];

const categoryOptions = ["Traje de flamenca", "Falda", "Blusa", "Mantón", "Flor", "Pendientes", "Zapatos", "Complemento"];

const statuses: ListingStatus[] = ["published", "draft", "reserved", "sold"];

const statusLabels: Record<(typeof statuses)[number], string> = {
  published: "Publicado",
  draft: "Borrador",
  reserved: "Reservado",
  sold: "Vendido",
};

const MyListings = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const db = supabase as any;

  const loadListings = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setUserId(null);
      setListings([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data, error } = await db
      .from("listings")
      .select("id,title,description,price_cents,original_price_cents,category,size,color,location,whatsapp_contact_allowed,condition,status,created_at,listing_images(storage_path,alt_text,sort_order)")
      .eq("seller_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as MyListing[];
    const imagePaths = rows
      .map((listing) => [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path)
      .filter(Boolean) as string[];
    const signedUrls = new Map<string, string>();

    if (imagePaths.length > 0) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("listing-images")
        .createSignedUrls(imagePaths, 60 * 60);

      if (signedError) {
        toast.error(signedError.message);
      } else {
        signedData?.forEach((signed) => {
          if (signed.path && signed.signedUrl) {
            signedUrls.set(signed.path, signed.signedUrl);
          }
        });
      }
    }

    setListings(
      rows.map((listing) => {
        const orderedImages = [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order);
        const firstImage = orderedImages[0];

        return {
          ...listing,
          imageUrl: firstImage ? signedUrls.get(firstImage.storage_path) || null : null,
          imagePaths: orderedImages.map((image) => image.storage_path),
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    loadListings();
  }, []);

  const countLabel = useMemo(() => `${listings.length} anuncio${listings.length === 1 ? "" : "s"}`, [listings.length]);

  const updateStatus = async (listingId: string, status: ListingStatus) => {
    const { error } = await db.from("listings").update({ status }).eq("id", listingId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setListings((current) => current.map((listing) => (listing.id === listingId ? { ...listing, status } : listing)));
    toast.success("Estado actualizado.");
  };

  const deleteListing = async (listing: MyListing) => {
    const confirmed = window.confirm("¿Eliminar este anuncio? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    if (listing.imagePaths?.length) {
      const { error: storageError } = await supabase.storage.from("listing-images").remove(listing.imagePaths);

      if (storageError) {
        toast.error(storageError.message);
        return;
      }
    }

    const { error } = await db.from("listings").delete().eq("id", listing.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setListings((current) => current.filter((item) => item.id !== listing.id));
    toast.success("Anuncio eliminado.");
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>, listingId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const price = Number(formData.get("price"));
    const originalPriceRaw = String(formData.get("original_price") || "").trim();
    const originalPrice = originalPriceRaw ? Number(originalPriceRaw) : null;
    const category = String(formData.get("category") || "").trim();
    const size = String(formData.get("size") || "").trim();
    const color = String(formData.get("color") || "").trim();
    const condition = String(formData.get("condition") || "") as MyListing["condition"];
    const location = String(formData.get("location") || "").trim();
    const whatsappContactAllowed = formData.get("whatsapp_contact_allowed") === "on";

    if (!title || title.length < 3) {
      toast.error("El título debe tener al menos 3 caracteres.");
      return;
    }

    if (!description || description.length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Introduce un precio válido.");
      return;
    }

    if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
      toast.error("Introduce un precio original válido o déjalo vacío.");
      return;
    }

    if (!category || !categoryOptions.includes(category)) {
      toast.error("Selecciona una categoría válida.");
      return;
    }

    if (!conditionOptions.some((option) => option.value === condition)) {
      toast.error("Selecciona un estado de conservación válido.");
      return;
    }

    const { error } = await db
      .from("listings")
      .update({
        title,
        description,
        price_cents: Math.round(price * 100),
        original_price_cents: originalPrice === null ? null : Math.round(originalPrice * 100),
        category,
        size: size || null,
        color: color || null,
        condition,
        location: location || null,
        whatsapp_contact_allowed: whatsappContactAllowed,
      })
      .eq("id", listingId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setListings((current) =>
      current.map((listing) =>
        listing.id === listingId
          ? {
              ...listing,
              title,
              description,
              price_cents: Math.round(price * 100),
              original_price_cents: originalPrice === null ? null : Math.round(originalPrice * 100),
              category,
              size: size || null,
              color: color || null,
              condition,
              location: location || null,
              whatsapp_contact_allowed: whatsappContactAllowed,
            }
          : listing
      )
    );
    setEditingId(null);
    toast.success("Anuncio actualizado.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando tus anuncios...</section>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Mis anuncios</h1>
          <p className="text-muted-foreground mb-8">Inicia sesión para ver y gestionar tus anuncios.</p>
          <Link to="/auth" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth">
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="text-primary text-sm font-medium uppercase tracking-widest">Panel</span>
              <h1 className="font-serif text-3xl md:text-5xl mt-3">Mis anuncios</h1>
            </div>
            <p className="text-muted-foreground text-sm md:max-w-xs">
              Gestiona {countLabel}: estado, edición básica y eliminación.
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Todavía no has publicado ningún anuncio.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
              {listings.map((listing) => (
                <article key={listing.id} className="group bg-card rounded-2xl overflow-hidden border border-border/60 hover:shadow-soft transition-smooth">
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={listing.imageUrl || placeholderImage}
                      alt={listing.title}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-700"
                    />
                  </div>
                  <div className="p-5">
                    {editingId === listing.id ? (
                      <form onSubmit={(event) => saveEdit(event, listing.id)} className="space-y-3">
                        <input
                          name="title"
                          defaultValue={listing.title}
                          required
                          maxLength={120}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <input
                          name="price"
                          type="number"
                          defaultValue={listing.price_cents / 100}
                          required
                          min={0}
                          step="0.01"
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <input
                          name="original_price"
                          type="number"
                          defaultValue={listing.original_price_cents ? listing.original_price_cents / 100 : ""}
                          min={0}
                          step="0.01"
                          placeholder="Precio original opcional (€)"
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <select
                          name="category"
                          defaultValue={listing.category}
                          required
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        >
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <input
                          name="size"
                          defaultValue={listing.size || ""}
                          placeholder="Talla"
                          maxLength={50}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <input
                          name="color"
                          defaultValue={listing.color || ""}
                          placeholder="Color"
                          maxLength={80}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <select
                          name="condition"
                          defaultValue={listing.condition}
                          required
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        >
                          {conditionOptions.map((condition) => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
                            </option>
                          ))}
                        </select>
                        <input
                          name="location"
                          defaultValue={listing.location || ""}
                          placeholder="Ubicación"
                          maxLength={120}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <label className="flex gap-3 items-start rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            name="whatsapp_contact_allowed"
                            defaultChecked={listing.whatsapp_contact_allowed}
                            className="mt-0.5 accent-primary"
                          />
                          <span>Permitir que usuarios registrados me contacten por WhatsApp</span>
                        </label>
                        <textarea
                          name="description"
                          defaultValue={listing.description}
                          required
                          rows={3}
                          maxLength={2000}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button type="submit" className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-deep transition-smooth">
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-smooth">
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      (() => {
                        const discount = getDiscountPercent(listing.original_price_cents, listing.price_cents);

                        return (
                      <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-serif text-lg leading-snug">{listing.title}</h3>
                          <div className="text-right whitespace-nowrap">
                            <div className="font-serif text-xl text-primary">{formatEuroFromCents(listing.price_cents)}€</div>
                            {discount && (
                              <div className="flex items-center justify-end gap-1.5 text-xs">
                                <span className="text-muted-foreground line-through">{formatEuroFromCents(listing.original_price_cents || 0)}€</span>
                                <span className="text-primary font-semibold">-{discount}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                          <span>Talla {listing.size || "Única"}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span>{conditionLabels[listing.condition]}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location || "Sin ubicación"}</span>
                        </div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
                        <select
                          value={listing.status}
                          onChange={(event) => updateStatus(listing.id, event.target.value as ListingStatus)}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 mb-3"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(listing.id)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-smooth"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteListing(listing)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-smooth"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                        );
                      })()
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MyListings;
