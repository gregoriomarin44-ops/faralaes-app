import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { SellerTrustBadges } from "@/components/SellerTrustBadges";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  location: string | null;
  bio: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  seller_badge: string | null;
};

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type Listing = {
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

const conditionLabels: Record<Listing["condition"], string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  good: "Buen estado",
};

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);

const wa = (listing: Listing) => {
  const message = `Hola, te escribo desde Faralaes.

Me interesa este artículo:

${listing.title}
Precio: ${formatPrice(listing.price_cents)}€
Talla: ${listing.size || "Única"}
Ubicación: ${listing.location || "Sin ubicación"}

¿Sigue disponible?`;

  return `https://wa.me/34633195730?text=${encodeURIComponent(message)}`;
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });

    const loadProfile = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("id,username,full_name,location,bio,phone,phone_verified,seller_badge")
        .eq("id", id)
        .maybeSingle();

      if (profileError) {
        toast.error(profileError.message);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      console.log("[UserProfile] seller trust profile", {
        sellerId: id,
        phone_verified: profileData.phone_verified,
        seller_badge: profileData.seller_badge,
      });

      const { data: listingsData, error: listingsError } = await (supabase as any)
        .from("listings")
        .select("id,seller_id,title,price_cents,category,size,color,location,whatsapp_contact_allowed,condition,published_at,listing_images(storage_path,alt_text,sort_order)")
        .eq("seller_id", id)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (listingsError) {
        toast.error(listingsError.message);
        setLoading(false);
        return;
      }

      const rows = (listingsData || []) as Listing[];
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

      setProfile(profileData as Profile);
      setListings(
        rows.map((listing) => {
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

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando perfil...</section>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Usuario no encontrado</h1>
          <p className="text-muted-foreground mb-8">Puede que el perfil no exista o ya no esté disponible.</p>
          <Link to="/catalogo" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-primary transition-smooth">
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </section>
      </main>
    );
  }

  const displayName = profile.full_name || profile.username || "Vendedora de Faralaes";

  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 md:py-20 bg-gradient-cream">
        <div className="container">
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-smooth mb-8">
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-5">
                <User className="w-6 h-6 text-primary" />
              </div>
              <span className="text-primary text-sm font-medium uppercase tracking-widest">Vendedora</span>
              <h1 className="font-serif text-4xl md:text-6xl mt-3 mb-4 text-balance">{displayName}</h1>
              {profile.location && (
                <div className="inline-flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {profile.bio && <p className="text-muted-foreground text-balance">{profile.bio}</p>}
              <div className="mt-5">
                <SellerTrustBadges
                  fullName={profile.full_name || profile.username}
                  location={profile.location}
                  bio={profile.bio}
                  phone={profile.phone}
                  phoneVerified={profile.phone_verified}
                  sellerBadge={profile.seller_badge}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-sm md:max-w-xs">
              {listings.length} anuncio{listings.length === 1 ? "" : "s"} publicado{listings.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-secondary/40">
        <div className="container">
          <div className="mb-8">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">Publicados</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">Anuncios de este vendedor</h2>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Este usuario no tiene anuncios publicados ahora mismo.
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
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={listing.imageUrl || placeholderImage}
                      alt={listing.imageAlt || listing.title}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-700"
                    />
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
                    {listing.seller_id !== currentUserId && listing.whatsapp_contact_allowed && currentUserId && (
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
                    {listing.seller_id !== currentUserId && listing.whatsapp_contact_allowed && !currentUserId && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate("/auth");
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-deep transition-smooth"
                      >
                        <MessageCircle className="w-4 h-4" /> Inicia sesión para WhatsApp
                      </button>
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

export default UserProfile;
