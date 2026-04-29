import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Flag, Mail, MapPin, MessageCircle, User, X } from "lucide-react";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { SellerTrustBadges } from "@/components/SellerTrustBadges";
import { supabase } from "@/integrations/supabase/client";
import { formatEuroFromCents, getDiscountPercent, getRelativeTime, wasEditedAfterPublished } from "@/lib/listingDisplay";

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type ProductListing = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  original_price_cents: number | null;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  shipping_available: boolean;
  whatsapp_contact_allowed: boolean;
  condition: "new" | "like_new" | "good";
  seller_id: string;
  published_at: string | null;
  updated_at: string | null;
  listing_images: ListingImage[];
};

type RelatedListing = {
  id: string;
  title: string;
  price_cents: number;
  category: string;
  size: string | null;
  location: string | null;
  condition: ProductListing["condition"];
  listing_images?: ListingImage[];
  imageUrl?: string | null;
  imageAlt?: string | null;
};

type RecentlyViewedItem = {
  id: string;
  title: string;
  price_cents: number;
  size: string | null;
  condition: ProductListing["condition"];
  location: string | null;
  image_url: string | null;
};

type GalleryImage = {
  url: string;
  alt: string;
};

type SellerProfile = {
  username: string | null;
  full_name: string | null;
  location: string | null;
  bio: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  seller_badge: string | null;
};

const reportReasons = [
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "scam", label: "Posible estafa" },
  { value: "wrong_item", label: "Producto incorrecto" },
  { value: "other", label: "Otro" },
] as const;

type ReportReason = (typeof reportReasons)[number]["value"];

const isReportReason = (value: string): value is ReportReason =>
  reportReasons.some((reason) => reason.value === value);

const conditionLabels: Record<ProductListing["condition"], string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  good: "Buen estado",
};

const RECENTLY_VIEWED_KEY = "faralaes_recently_viewed";

const wa = (listing: ProductListing) => {
  const message = `Hola, te escribo desde Faralaes.

Me interesa este artículo:

${listing.title}
Precio: ${formatEuroFromCents(listing.price_cents)}€
Talla: ${listing.size || "Única"}
Ubicación: ${listing.location || "Sin ubicación"}

¿Sigue disponible?`;

  return `https://wa.me/34633195730?text=${encodeURIComponent(message)}`;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ProductListing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("inappropriate");
  const [reportMessage, setReportMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [relatedListings, setRelatedListings] = useState<RelatedListing[]>([]);
  const [sellerListings, setSellerListings] = useState<RelatedListing[]>([]);
  const [recentListings, setRecentListings] = useState<RelatedListing[]>([]);

  useEffect(() => {
    const loadListing = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await (supabase as any)
        .from("listings")
        .select(
          "id,title,description,price_cents,original_price_cents,category,size,color,location,shipping_available,whatsapp_contact_allowed,condition,seller_id,published_at,updated_at,listing_images(storage_path,alt_text,sort_order)"
        )
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        console.error("[ProductDetail] Supabase listing query failed", { id, error });
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!data) {
        console.info("[ProductDetail] No published listing found", { id });
        setNotFound(true);
        setLoading(false);
        return;
      }

      const row = data as ProductListing;
      console.info("[ProductDetail] Published listing loaded", {
        id: row.id,
        sellerId: row.seller_id,
        imageCount: row.listing_images?.length || 0,
      });

      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("username,full_name,location,bio,phone,phone_verified,seller_badge")
        .eq("id", row.seller_id)
        .maybeSingle();

      if (profileError) {
        console.error("[ProductDetail] Supabase seller profile query failed", {
          sellerId: row.seller_id,
          error: profileError,
        });
      } else {
        console.log("[ProductDetail] seller trust profile", {
          sellerId: row.seller_id,
          phone_verified: profileData?.phone_verified,
          seller_badge: profileData?.seller_badge,
        });
      }

      const orderedImages = [...(row.listing_images || [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 5);
      const paths = orderedImages.map((image) => image.storage_path);
      const signedUrls = new Map<string, string>();

      if (paths.length > 0) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from("listing-images")
          .createSignedUrls(paths, 60 * 60);

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

      setListing(row);
      setSeller((profileData || null) as SellerProfile | null);
      setImages(
        orderedImages
          .map((image) => ({
            url: signedUrls.get(image.storage_path) || "",
            alt: image.alt_text || row.title,
          }))
          .filter((image) => image.url)
      );
      setSelectedImage(0);
      setLoading(false);
    };

    loadListing();
  }, [id]);

  useEffect(() => {
    const loadRelatedListings = async () => {
      if (!listing) {
        setRelatedListings([]);
        return;
      }

      const db = supabase as any;
      const selectFields = "id,title,price_cents,category,size,location,condition,listing_images(storage_path,alt_text,sort_order)";

      const { data: sameCategoryData, error: sameCategoryError } = await db
        .from("listings")
        .select(selectFields)
        .eq("status", "published")
        .eq("category", listing.category)
        .neq("id", listing.id)
        .order("published_at", { ascending: false })
        .limit(8);

      if (sameCategoryError) {
        toast.error(sameCategoryError.message);
        return;
      }

      const related = (sameCategoryData || []) as RelatedListing[];
      let rows = related;

      if (related.length < 4) {
        const excludeIds = [listing.id, ...related.map((item) => item.id)];
        const { data: fallbackData, error: fallbackError } = await db
          .from("listings")
          .select(selectFields)
          .eq("status", "published")
          .not("id", "in", `(${excludeIds.join(",")})`)
          .order("published_at", { ascending: false })
          .limit(8 - related.length);

        if (fallbackError) {
          toast.error(fallbackError.message);
        } else {
          rows = [...related, ...((fallbackData || []) as RelatedListing[])];
        }
      }

      const limitedRows = rows.slice(0, 8);
      const imagePaths = limitedRows
        .map((item) => [...(item.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path)
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

      setRelatedListings(
        limitedRows.map((item) => {
          const firstImage = [...(item.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];

          return {
            ...item,
            imageUrl: firstImage ? signedUrls.get(firstImage.storage_path) || null : null,
            imageAlt: firstImage?.alt_text || item.title,
          };
        })
      );
    };

    loadRelatedListings();
  }, [listing]);

  useEffect(() => {
    const loadSellerListings = async () => {
      if (!listing) {
        setSellerListings([]);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("listings")
        .select("id,title,price_cents,category,size,location,condition,listing_images(storage_path,alt_text,sort_order)")
        .eq("status", "published")
        .eq("seller_id", listing.seller_id)
        .neq("id", listing.id)
        .order("published_at", { ascending: false })
        .limit(8);

      if (error) {
        toast.error(error.message);
        return;
      }

      const rows = (data || []) as RelatedListing[];
      const imagePaths = rows
        .map((item) => [...(item.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path)
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

      setSellerListings(
        rows.map((item) => {
          const firstImage = [...(item.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];

          return {
            ...item,
            imageUrl: firstImage ? signedUrls.get(firstImage.storage_path) || null : null,
            imageAlt: firstImage?.alt_text || item.title,
          };
        })
      );
    };

    loadSellerListings();
  }, [listing]);

  useEffect(() => {
    const readRecentItems = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
        return Array.isArray(parsed)
          ? parsed.filter((value): value is RecentlyViewedItem => Boolean(value?.id && value?.title && typeof value.price_cents === "number"))
          : [];
      } catch {
        return [];
      }
    };

    const writeRecentItems = (items: RecentlyViewedItem[]) => {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items.slice(0, 12)));
      console.log("[ProductDetail] recently viewed saved", items.slice(0, 12));
    };

    const showRecentItems = (currentListingId: string, items: RecentlyViewedItem[]) => {
      setRecentListings(
        items
          .filter((item) => item.id !== currentListingId)
          .slice(0, 6)
          .map((item) => ({
            id: item.id,
            title: item.title,
            price_cents: item.price_cents,
            category: "",
            size: item.size,
            location: item.location,
            condition: item.condition,
            imageUrl: item.image_url,
            imageAlt: item.title,
          }))
      );
    };

    if (!listing?.id) {
      setRecentListings([]);
      return;
    }

    const currentItems = readRecentItems();
    showRecentItems(listing.id, currentItems);

    const currentSnapshot: RecentlyViewedItem = {
      id: listing.id,
      title: listing.title,
      price_cents: listing.price_cents,
      size: listing.size,
      condition: listing.condition,
      location: listing.location,
      image_url: images[0]?.url || null,
    };
    const nextItems = [currentSnapshot, ...currentItems.filter((item) => item.id !== listing.id)];
    writeRecentItems(nextItems);
  }, [listing, images]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user.id || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const sellerName = useMemo(() => {
    if (!listing) return "";
    return seller?.full_name || seller?.username || "Vendedora de Faralaes";
  }, [listing, seller]);

  const startConversation = async () => {
    if (!listing) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      toast.error("Inicia sesión para enviar un mensaje.");
      navigate("/auth");
      return;
    }

    if (userData.user.id === listing.seller_id) {
      toast.error("Este anuncio es tuyo.");
      return;
    }

    const db = supabase as any;
    const { data: existing, error: existingError } = await db
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", userData.user.id)
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
        buyer_id: userData.user.id,
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

  const openReport = () => {
    if (!currentUserId) {
      toast.error("Inicia sesión para reportar un anuncio.");
      navigate("/auth");
      return;
    }

    setReportOpen(true);
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reporting) return;

    if (!listing?.id) {
      toast.error("No se puede reportar: falta el ID del anuncio.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      toast.error("Inicia sesión para reportar un anuncio.");
      navigate("/auth");
      return;
    }

    const reason = reportReason;
    const message = reportMessage.trim();
    const reporterId = userData.user.id;

    if (!isReportReason(reason)) {
      toast.error("Selecciona un motivo válido.");
      return;
    }

    setReporting(true);

    const { data: existingReport, error: existingError } = await supabase
      .from("reports")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("reporter_id", reporterId)
      .maybeSingle();

    if (existingError) {
      setReporting(false);
      toast.error(`No se pudo comprobar el reporte: ${existingError.message}`);
      return;
    }

    if (existingReport) {
      setReporting(false);
      toast.error("Ya has reportado este anuncio.");
      return;
    }

    const reportPayload = {
      listing_id: listing.id,
      reporter_id: reporterId,
      reason,
      message: message || null,
      status: "pending",
    } as const;

    const insertResult = await supabase.from("reports").insert(reportPayload);
    console.log("[ProductDetail] report insert result", insertResult);

    setReporting(false);

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        toast.error("Ya has reportado este anuncio.");
      } else {
        toast.error(insertResult.error.message);
      }
      return;
    }

    setReportOpen(false);
    setReportReason("inappropriate");
    setReportMessage("");
    toast.success("Reporte enviado correctamente");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando anuncio...</section>
      </main>
    );
  }

  if (notFound || !listing) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Anuncio no encontrado</h1>
          <p className="text-muted-foreground mb-8">Puede que el anuncio ya no exista o no esté publicado.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-primary transition-smooth">
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </section>
      </main>
    );
  }

  const mainImage = images[selectedImage]?.url || placeholderImage;
  const discount = getDiscountPercent(listing.original_price_cents, listing.price_cents);
  const publishedAgo = getRelativeTime(listing.published_at);
  const editedAgo = wasEditedAfterPublished(listing.published_at, listing.updated_at) ? getRelativeTime(listing.updated_at) : null;
  const isOwner = currentUserId === listing.seller_id;

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-14">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-smooth mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-start">
          <div className="space-y-4">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted border border-border/60 shadow-soft">
              <img src={mainImage} alt={images[selectedImage]?.alt || listing.title} className="w-full h-full object-cover" />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.url}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-xl border transition-smooth ${
                      selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border/60 hover:border-primary/50"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-6">
              <span className="text-primary text-sm font-medium uppercase tracking-widest">{listing.category}</span>
              <h1 className="font-serif text-4xl md:text-6xl mt-3 mb-4 text-balance">{listing.title}</h1>
              <div className="flex flex-wrap items-end gap-3">
                <div className="font-serif text-3xl text-primary">{formatEuroFromCents(listing.price_cents)}€</div>
                {discount && (
                  <div className="flex items-center gap-2 pb-1 text-sm">
                    <span className="text-muted-foreground line-through">{formatEuroFromCents(listing.original_price_cents || 0)}€</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-semibold">-{discount}%</span>
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {publishedAgo && <span>Publicado {publishedAgo}</span>}
                {editedAgo && <span className="block">Editado {editedAgo}</span>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8 text-sm">
              <Detail label="Talla" value={listing.size || "Única"} />
              <Detail label="Color" value={listing.color || "Sin especificar"} />
              <Detail label="Estado" value={conditionLabels[listing.condition]} />
              <Detail label="Categoría" value={listing.category} />
              <Detail label="Ubicación" value={listing.location || "Sin ubicación"} />
              <Detail label="Vendedor" value={sellerName} />
            </div>

            {listing.shipping_available && (
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-8">
                ✔ Envío disponible
              </div>
            )}

            <div className="prose prose-sm max-w-none mb-8">
              <h2 className="font-serif text-2xl mb-3">Descripción</h2>
              <p className="text-muted-foreground whitespace-pre-line">{listing.description}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <User className="w-4 h-4" />
              <Link to={`/usuario/${listing.seller_id}`} className="font-medium text-foreground hover:text-primary transition-smooth">
                {sellerName}
              </Link>
              {seller?.location && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <MapPin className="w-4 h-4" />
                  <span>{seller.location}</span>
                </>
              )}
            </div>
            {seller && (
              <div className="mb-6">
                <SellerTrustBadges
                  fullName={seller.full_name || seller.username}
                  location={seller.location}
                  bio={seller.bio}
                  phone={seller.phone}
                  phoneVerified={seller.phone_verified}
                  sellerBadge={seller.seller_badge}
                />
              </div>
            )}

            {!isOwner && (
              <>
                {listing.whatsapp_contact_allowed && currentUserId && (
                  <a
                    href={wa(listing)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium shadow-coral hover:bg-primary-deep transition-smooth"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Me interesa por WhatsApp
                  </a>
                )}
                {listing.whatsapp_contact_allowed && !currentUserId && (
                  <Link
                    to="/auth"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium shadow-coral hover:bg-primary-deep transition-smooth"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Inicia sesión para contactar por WhatsApp
                  </Link>
                )}
                <button
                  type="button"
                  onClick={startConversation}
                  className="w-full sm:w-auto sm:ml-3 mt-3 sm:mt-0 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-foreground text-background font-medium hover:bg-foreground/85 transition-smooth"
                >
                  <Mail className="w-4 h-4" />
                  Enviar mensaje
                </button>
              </>
            )}
            {currentUserId && (
              <button
                type="button"
                onClick={openReport}
                className="w-full sm:w-auto mt-3 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-border bg-background text-foreground font-medium hover:border-primary/50 hover:text-primary transition-smooth"
              >
                <Flag className="w-4 h-4" />
                Reportar anuncio
              </button>
            )}
          </div>
        </div>

        {sellerListings.length > 0 && (
          <section className="mt-16 md:mt-24">
            <div className="max-w-6xl">
              <div className="mb-8">
                <span className="text-primary text-sm font-medium uppercase tracking-widest">Del mismo vendedor</span>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-3">
                  <h2 className="font-serif text-3xl md:text-4xl">Más de este vendedor</h2>
                  <Link to={`/usuario/${listing.seller_id}`} className="text-sm font-medium text-primary hover:underline sm:pb-1">
                    Ver más de este vendedor →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
                {sellerListings.map((item) => (
                  <ListingCard key={item.id} item={item} onOpen={() => navigate(`/producto/${item.id}`)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {relatedListings.length > 0 && (
          <section className="mt-16 md:mt-24">
            <div className="mb-8">
              <span className="text-primary text-sm font-medium uppercase tracking-widest">También te puede interesar</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-3">Artículos similares</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
              {relatedListings.map((item) => (
                <ListingCard key={item.id} item={item} onOpen={() => navigate(`/producto/${item.id}`)} />
              ))}
            </div>
          </section>
        )}

        {recentListings.length > 0 && (
          <section className="mt-16 md:mt-24">
            <div className="mb-8">
              <span className="text-primary text-sm font-medium uppercase tracking-widest">Tu historial</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-3">Vistos recientemente</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 md:gap-6">
              {recentListings.map((item) => (
                <ListingCard key={item.id} item={item} onOpen={() => navigate(`/producto/${item.id}`)} />
              ))}
            </div>
          </section>
        )}
      </section>

      {reportOpen && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-4">
          <form onSubmit={submitReport} className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-serif text-2xl">Reportar anuncio</h2>
                <p className="text-sm text-muted-foreground mt-1">Cuéntanos qué ocurre con este artículo.</p>
              </div>
              <button type="button" onClick={() => setReportOpen(false)} className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Motivo</label>
                <select
                  name="reason"
                  required
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value as ReportReason)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  {reportReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Comentario opcional</label>
                <textarea
                  name="message"
                  rows={4}
                  maxLength={1000}
                  value={reportMessage}
                  onChange={(event) => setReportMessage(event.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="Añade cualquier detalle que ayude a revisar el anuncio."
                />
              </div>

              <button type="submit" disabled={reporting} className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth disabled:opacity-60">
                {reporting ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    <div className="font-medium text-foreground">{value}</div>
  </div>
);

const ListingCard = ({ item, onOpen }: { item: RelatedListing; onOpen: () => void }) => (
  <article
    onClick={onOpen}
    className="group bg-card rounded-2xl overflow-hidden border border-border/60 hover:shadow-soft transition-smooth cursor-pointer"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen();
      }
    }}
  >
    <div className="aspect-[4/5] overflow-hidden bg-muted">
      <img
        src={item.imageUrl || placeholderImage}
        alt={item.imageAlt || item.title}
        loading="lazy"
        width={800}
        height={1000}
        className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-700"
      />
    </div>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-serif text-lg leading-snug">{item.title}</h3>
        <div className="font-serif text-xl text-primary whitespace-nowrap">{formatEuroFromCents(item.price_cents)}€</div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Talla {item.size || "Única"}</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <span>{conditionLabels[item.condition]}</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location || "Sin ubicación"}</span>
      </div>
    </div>
  </article>
);

export default ProductDetail;
