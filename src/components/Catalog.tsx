import { useEffect, useState } from "react";
import { Heart, Mail, MapPin, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { supabase } from "@/integrations/supabase/client";
import { formatEuroFromCents, getDiscountPercent, getRelativeTime, wasEditedAfterPublished } from "@/lib/listingDisplay";

type Listing = {
  id: string;
  seller_id: string;
  title: string;
  price_cents: number;
  original_price_cents: number | null;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  shipping_available: boolean;
  condition: "new" | "like_new" | "good";
  status: "published";
  published_at: string | null;
  updated_at: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: ListingGalleryImage[];
};

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type ListingGalleryImage = {
  url: string;
  alt: string;
  sortOrder: number;
  storagePath: string;
};

const conditionLabels: Record<Listing["condition"], string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  good: "Buen estado",
};

const conditionValues: Record<string, Listing["condition"]> = {
  Nuevo: "new",
  "Como nuevo": "like_new",
  "Buen estado": "good",
};

const rangosPrecio = ["Todos", "Hasta 50€", "50€ - 150€", "150€ - 300€", "Más de 300€"];
const orderOptions = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
] as const;

type OrderOption = (typeof orderOptions)[number]["value"];

const priceRangeInCents = (range: string) => {
  if (range === "Hasta 50€") return { max: 5000 };
  if (range === "50€ - 150€") return { min: 5001, max: 15000 };
  if (range === "150€ - 300€") return { min: 15001, max: 30000 };
  if (range === "Más de 300€") return { min: 30001 };
  return {};
};

const FilterPills = ({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
    {items.map((it) => (
      <button
        key={it}
        onClick={() => onChange(it)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-smooth ${
          value === it
            ? "bg-foreground text-background border-foreground"
            : "bg-card text-foreground/70 border-border hover:border-foreground/40"
        }`}
      >
        {it}
      </button>
    ))}
  </div>
);

const EmptyCatalogMessage = ({ articleSearch, locationSearch }: { articleSearch: string; locationSearch: string }) => {
  const article = articleSearch.trim();
  const location = locationSearch.trim();

  if (article && location) {
    return <>No se ha encontrado ningún anuncio de {article} en {location}.</>;
  }

  if (article) {
    return <>No se ha encontrado ningún anuncio de {article}.</>;
  }

  if (location) {
    return <>No se ha encontrado ningún anuncio en {location}.</>;
  }

  return <>No hay prendas que coincidan con la búsqueda o los filtros.</>;
};

export const Catalog = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [articleSearch, setArticleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [order, setOrder] = useState<OrderOption>("recent");
  const [cat, setCat] = useState("Todas");
  const [talla, setTalla] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [color, setColor] = useState("Todos");
  const [precio, setPrecio] = useState("Todos");
  const [shippingOnly, setShippingOnly] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    categorias: ["Todas"],
    tallas: ["Todas"],
    estados: ["Todos"],
    colores: ["Todos"],
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("category,size,color,condition")
        .eq("status", "published");

      if (error) {
        toast.error(error.message);
        return;
      }

      const rows = (data || []) as Pick<Listing, "category" | "size" | "color" | "condition">[];
      setFilterOptions({
        categorias: ["Todas", ...Array.from(new Set(rows.map((p) => p.category).filter(Boolean)))],
        tallas: ["Todas", ...Array.from(new Set(rows.map((p) => p.size).filter(Boolean)))],
        estados: ["Todos", ...Array.from(new Set(rows.map((p) => conditionLabels[p.condition])))],
        colores: ["Todos", ...Array.from(new Set(rows.map((p) => p.color).filter(Boolean)))],
      });
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id || null);
      if (!session?.user.id) {
        setFavoriteIds(new Set());
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);

      let query = (supabase as any)
        .from("listings")
        .select("id,seller_id,title,price_cents,original_price_cents,category,size,color,location,shipping_available,condition,status,published_at,updated_at,listing_images(storage_path,alt_text,sort_order)")
        .eq("status", "published");

      const articleTerm = articleSearch.trim().replace(/[%_,]/g, " ");
      const locationTerm = locationSearch.trim().replace(/[%_,]/g, " ");
      if (articleTerm) {
        query = query.or(`title.ilike.%${articleTerm}%,description.ilike.%${articleTerm}%`);
      }
      if (locationTerm) {
        query = query.ilike("location", `%${locationTerm}%`);
      }

      if (cat !== "Todas") query = query.eq("category", cat);
      if (talla !== "Todas") query = query.eq("size", talla);
      if (estado !== "Todos") query = query.eq("condition", conditionValues[estado]);
      if (color !== "Todos") query = query.eq("color", color);
      if (shippingOnly) query = query.eq("shipping_available", true);

      const range = priceRangeInCents(precio);
      if (range.min !== undefined) query = query.gte("price_cents", range.min);
      if (range.max !== undefined) query = query.lte("price_cents", range.max);

      if (order === "price_asc") {
        query = query.order("price_cents", { ascending: true });
      } else if (order === "price_desc") {
        query = query.order("price_cents", { ascending: false });
      } else {
        query = query.order("published_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const rows = (data || []) as (Listing & { listing_images?: ListingImage[] })[];
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

      const mappedListings = rows.map(({ listing_images, ...listing }) => {
        const images = [...(listing_images || [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((image) => ({
            url: signedUrls.get(image.storage_path) || "",
            alt: image.alt_text || listing.title,
            sortOrder: image.sort_order,
            storagePath: image.storage_path,
          }))
          .filter((image) => image.url);
        const firstImage = images[0];

        return {
          ...listing,
          images,
          imageUrl: firstImage?.url || null,
          imageAlt: firstImage?.alt || listing.title,
        };
      });

      setListings(mappedListings);

      if (userId && mappedListings.length > 0) {
        const { data: favoritesData, error: favoritesError } = await (supabase as any)
          .from("favorites")
          .select("listing_id")
          .eq("user_id", userId)
          .in("listing_id", mappedListings.map((listing) => listing.id));

        if (favoritesError) {
          toast.error(favoritesError.message);
        } else {
          setFavoriteIds(new Set((favoritesData || []).map((favorite: { listing_id: string }) => favorite.listing_id)));
        }
      } else {
        setFavoriteIds(new Set());
      }

      setLoading(false);
    };

    loadListings();
  }, [articleSearch, locationSearch, cat, talla, estado, color, precio, shippingOnly, order, userId]);

  const toggleFavorite = async (listingId: string) => {
    if (!userId) {
      toast.error("Inicia sesión para guardar favoritos.");
      navigate("/auth");
      return;
    }

    const isFavorite = favoriteIds.has(listingId);
    const nextFavorites = new Set(favoriteIds);

    if (isFavorite) {
      nextFavorites.delete(listingId);
      setFavoriteIds(nextFavorites);

      const { error } = await (supabase as any)
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);

      if (error) {
        nextFavorites.add(listingId);
        setFavoriteIds(new Set(nextFavorites));
        toast.error(error.message);
        return;
      }

      toast.success("Quitado de favoritos.");
      return;
    }

    nextFavorites.add(listingId);
    setFavoriteIds(nextFavorites);

    const { error } = await (supabase as any).from("favorites").insert({
      user_id: userId,
      listing_id: listingId,
    });

    if (error) {
      nextFavorites.delete(listingId);
      setFavoriteIds(new Set(nextFavorites));
      toast.error(error.message);
      return;
    }

    toast.success("Guardado en favoritos.");
  };

  const wa = (listing: Listing) => {
    const message = `Hola, te escribo desde Faralaes.

Me interesa este artículo:

${listing.title}
Precio: ${formatEuroFromCents(listing.price_cents)}€
Talla: ${listing.size || "Única"}
Ubicación: ${listing.location || "Sin ubicación"}

¿Sigue disponible?`;

    return `https://wa.me/34633195730?text=${encodeURIComponent(message)}`;
  };

  const startConversation = async (listing: Listing) => {
    if (!userId) {
      toast.error("Inicia sesión para enviar un mensaje.");
      navigate("/auth");
      return;
    }

    if (userId === listing.seller_id) {
      toast.error("Este anuncio es tuyo.");
      return;
    }

    const db = supabase as any;
    const { data: existing, error: existingError } = await db
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", userId)
      .maybeSingle();

    if (existingError) {
      toast.error(existingError.message);
      return;
    }

    if (existing?.id) {
      navigate("/mensajes", { state: { conversationId: existing.id } });
      return;
    }

    const { data: created, error: createError } = await db
      .from("conversations")
      .insert({
        listing_id: listing.id,
        buyer_id: userId,
        seller_id: listing.seller_id,
      })
      .select("id")
      .single();

    if (createError) {
      toast.error(createError.message);
      return;
    }

    navigate("/mensajes", { state: { conversationId: created.id } });
  };

  return (
    <section id="catalogo" className="py-16 md:py-28 bg-secondary/40">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="text-primary text-sm font-medium uppercase tracking-widest">Catálogo</span>
            <h2 className="font-serif text-3xl md:text-5xl mt-3">Prendas seleccionadas a mano</h2>
          </div>
          <p className="text-muted-foreground text-sm md:max-w-xs">
            Mostrando {listings.length} prendas publicadas. Contacta directamente con la vendedora.
          </p>
        </div>

        <div className="space-y-3 mb-10">
          <div className="grid md:grid-cols-[1fr_1fr_220px] gap-3">
            <input
              value={articleSearch}
              onChange={(event) => setArticleSearch(event.target.value)}
              placeholder="¿Qué buscas?"
              aria-label="¿Qué buscas?"
              className="w-full rounded-full border border-input bg-card px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <input
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              placeholder="¿Dónde?"
              aria-label="¿Dónde?"
              className="w-full rounded-full border border-input bg-card px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value as OrderOption)}
              className="w-full rounded-full border border-input bg-card px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              {orderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FilterPills items={filterOptions.categorias} value={cat} onChange={setCat} />
          <div className="grid md:grid-cols-2 gap-3">
            <FilterPills items={filterOptions.tallas} value={talla} onChange={setTalla} />
            <FilterPills items={filterOptions.estados} value={estado} onChange={setEstado} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <FilterPills items={filterOptions.colores} value={color} onChange={setColor} />
            <FilterPills items={rangosPrecio} value={precio} onChange={setPrecio} />
          </div>
          <label className="inline-flex w-full md:w-auto items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground/80 cursor-pointer hover:border-foreground/30 transition-smooth">
            <input
              type="checkbox"
              checked={shippingOnly}
              onChange={(event) => setShippingOnly(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Solo anuncios con envío disponible</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
          {listings.map((p) => {
              const discount = getDiscountPercent(p.original_price_cents, p.price_cents);
              const publishedAgo = getRelativeTime(p.published_at);
              const editedAgo = wasEditedAfterPublished(p.published_at, p.updated_at) ? getRelativeTime(p.updated_at) : null;
              const isOwner = userId === p.seller_id;

              return (
                <article
                  key={p.id}
                  onClick={() => navigate(`/producto/${p.id}`)}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/60 hover:shadow-soft transition-smooth cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/producto/${p.id}`);
                    }
                  }}
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                    <img
                      src={p.imageUrl || placeholderImage}
                      alt={p.imageAlt || p.title}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-700"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-soft transition-smooth ${
                        favoriteIds.has(p.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground"
                      }`}
                      aria-label={favoriteIds.has(p.id) ? "Quitar de favoritos" : "Guardar favorito"}
                    >
                      <Heart className={`w-5 h-5 ${favoriteIds.has(p.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-lg leading-snug">{p.title}</h3>
                      <div className="text-right whitespace-nowrap">
                        <div className="font-serif text-xl text-primary">{formatEuroFromCents(p.price_cents)}€</div>
                        {discount && (
                          <div className="flex items-center justify-end gap-1.5 text-xs">
                            <span className="text-muted-foreground line-through">{formatEuroFromCents(p.original_price_cents || 0)}€</span>
                            <span className="text-primary font-semibold">-{discount}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                      <span>Talla {p.size || "Única"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{conditionLabels[p.condition]}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location || "Sin ubicación"}</span>
                      {p.shipping_available && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span>Envío disponible</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {publishedAgo && <span>Publicado {publishedAgo}</span>}
                      {editedAgo && <span className="block">Editado {editedAgo}</span>}
                    </div>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate("/mis-anuncios");
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-smooth"
                      >
                        Ver / editar en Mis anuncios
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            startConversation(p);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1DA851] transition-smooth shadow-sm"
                        >
                          <Mail className="w-4 h-4" /> Enviar mensaje
                        </button>
                        <a
                          href={wa(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-background border border-[#25D366]/70 text-[#128C3A] text-sm font-medium hover:bg-[#25D366]/10 transition-smooth"
                        >
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
        </div>

        {!loading && listings.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <EmptyCatalogMessage articleSearch={articleSearch} locationSearch={locationSearch} />
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-muted-foreground">
            Cargando prendas...
          </div>
        )}
      </div>
    </section>
  );
};
