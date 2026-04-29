import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { supabase } from "@/integrations/supabase/client";

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type FavoriteListing = {
  id: string;
  seller_id: string;
  title: string;
  price_cents: number;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  whatsapp_contact_allowed: boolean;
  condition: "new" | "like_new" | "good";
  listing_images: ListingImage[];
  imageUrl?: string | null;
  imageAlt?: string | null;
};

type FavoriteRow = {
  listing_id: string;
  listings: FavoriteListing | null;
};

const conditionLabels: Record<FavoriteListing["condition"], string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  good: "Buen estado",
};

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);

const wa = (listing: FavoriteListing) => {
  const message = `Hola, te escribo desde Faralaes.

Me interesa este artículo:

${listing.title}
Precio: ${formatPrice(listing.price_cents)}€
Talla: ${listing.size || "Única"}
Ubicación: ${listing.location || "Sin ubicación"}

¿Sigue disponible?`;

  return `https://wa.me/34633195730?text=${encodeURIComponent(message)}`;
};

const Favorites = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [listings, setListings] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setUserId(null);
      setListings([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data, error } = await (supabase as any)
      .from("favorites")
      .select("listing_id,listings!inner(id,seller_id,title,price_cents,category,size,color,location,whatsapp_contact_allowed,condition,status,listing_images(storage_path,alt_text,sort_order))")
      .eq("user_id", userData.user.id)
      .eq("listings.status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const favoriteListings = ((data || []) as FavoriteRow[])
      .map((favorite) => favorite.listings)
      .filter(Boolean) as FavoriteListing[];
    const imagePaths = favoriteListings
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
      favoriteListings.map((listing) => {
        const firstImage = [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];

        return {
          ...listing,
          imageUrl: firstImage ? signedUrls.get(firstImage.storage_path) || null : null,
          imageAlt: firstImage?.alt_text || listing.title,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async (listingId: string) => {
    if (!userId) return;

    const { error } = await (supabase as any)
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setListings((current) => current.filter((listing) => listing.id !== listingId));
    toast.success("Quitado de favoritos.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando favoritos...</section>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Favoritos</h1>
          <p className="text-muted-foreground mb-8">Inicia sesión para ver tus prendas guardadas.</p>
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
              <span className="text-primary text-sm font-medium uppercase tracking-widest">Guardados</span>
              <h1 className="font-serif text-3xl md:text-5xl mt-3">Favoritos</h1>
            </div>
            <p className="text-muted-foreground text-sm md:max-w-xs">
              {listings.length} prenda{listings.length === 1 ? "" : "s"} guardada{listings.length === 1 ? "" : "s"}.
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Todavía no has guardado ningún anuncio.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
              {listings.map((listing) => (
                <article
                  key={listing.id}
                  onClick={() => navigate(`/producto/${listing.id}`)}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/60 hover:shadow-soft transition-smooth cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/producto/${listing.id}`);
                    }
                  }}
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                    <img
                      src={listing.imageUrl || placeholderImage}
                      alt={listing.imageAlt || listing.title}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-700"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFavorite(listing.id);
                      }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-soft transition-smooth bg-primary text-primary-foreground"
                      aria-label="Quitar de favoritos"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-lg leading-snug">{listing.title}</h3>
                      <div className="font-serif text-xl text-primary whitespace-nowrap">{Math.round(listing.price_cents / 100)}€</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                      <span>Talla {listing.size || "Única"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{conditionLabels[listing.condition]}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location || "Sin ubicación"}</span>
                    </div>
                    {listing.seller_id !== userId && listing.whatsapp_contact_allowed && (
                      <a
                        href={wa(listing)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-deep transition-smooth"
                      >
                        <MessageCircle className="w-4 h-4" /> Me interesa por WhatsApp
                      </a>
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

export default Favorites;
