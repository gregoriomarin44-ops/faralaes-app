import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { getCurrentUserAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

type ReportStatus = "pending" | "reviewed" | "dismissed";

type Report = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: "inappropriate" | "scam" | "wrong_item" | "other";
  message: string | null;
  status: ReportStatus;
  created_at: string;
};

type Listing = {
  id: string;
  title: string;
  price_cents: number;
  size: string | null;
  location: string | null;
  condition: "new" | "like_new" | "good";
  seller_id: string;
  status: string;
  listing_images?: ListingImage[];
};

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
};

type ReportView = Report & {
  listingTitle: string;
  listingStatus: string;
  listingPriceCents: number | null;
  listingSize: string;
  listingLocation: string;
  listingCondition: string;
  listingImageUrl: string;
  sellerName: string;
  reporterName: string;
};

const reasonLabels: Record<Report["reason"], string> = {
  inappropriate: "Contenido inapropiado",
  scam: "Posible estafa",
  wrong_item: "Producto incorrecto",
  other: "Otro",
};

const conditionLabels: Record<Listing["condition"], string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  good: "Buen estado",
};

const formatPrice = (priceCents: number | null) =>
  priceCents === null ? "Sin precio" : `${Math.round(priceCents / 100)}€`;

const AdminReports = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportView[]>([]);

  const db = supabase as any;

  const loadReports = async () => {
    setLoading(true);

    const { isAdmin: admin } = await getCurrentUserAdmin();

    if (!admin) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data, error } = await db
      .from("reports")
      .select("id,listing_id,reporter_id,reason,message,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Report[];
    const listingIds = Array.from(new Set(rows.map((report) => report.listing_id)));
    const reporterIds = Array.from(new Set(rows.map((report) => report.reporter_id)));
    const listings = new Map<string, Listing>();
    const profiles = new Map<string, Profile>();
    const imageUrls = new Map<string, string>();

    if (listingIds.length > 0) {
      const { data: listingsData, error: listingsError } = await db
        .from("listings")
        .select("id,title,price_cents,size,location,condition,seller_id,status,listing_images(storage_path,alt_text,sort_order)")
        .in("id", listingIds);

      if (listingsError) {
        toast.error(listingsError.message);
      } else {
        (listingsData || []).forEach((listing: Listing) => listings.set(listing.id, listing));
      }
    }

    const sellerIds = Array.from(new Set(Array.from(listings.values()).map((listing) => listing.seller_id)));
    const profileIds = Array.from(new Set([...reporterIds, ...sellerIds]));

    if (profileIds.length > 0) {
      const { data: profilesData, error: profilesError } = await db
        .from("profiles")
        .select("id,full_name,username")
        .in("id", profileIds);

      if (profilesError) {
        toast.error(profilesError.message);
      } else {
        (profilesData || []).forEach((profileRow: Profile) => profiles.set(profileRow.id, profileRow));
      }
    }

    const firstImagePaths = Array.from(listings.values())
      .map((listing) => [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path)
      .filter(Boolean) as string[];

    if (firstImagePaths.length > 0) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("listing-images")
        .createSignedUrls(firstImagePaths, 60 * 60);

      if (signedError) {
        toast.error(signedError.message);
      } else {
        signedData?.forEach((signed) => {
          if (signed.path && signed.signedUrl) {
            imageUrls.set(signed.path, signed.signedUrl);
          }
        });
      }
    }

    setReports(
      rows.map((report) => {
        const listing = listings.get(report.listing_id);
        const firstImage = listing
          ? [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]
          : undefined;
        const seller = listing ? profiles.get(listing.seller_id) : undefined;
        const reporter = profiles.get(report.reporter_id);

        return {
          ...report,
          listingTitle: listing?.title || "Anuncio no disponible",
          listingStatus: listing?.status || "desconocido",
          listingPriceCents: listing?.price_cents ?? null,
          listingSize: listing?.size || "Única",
          listingLocation: listing?.location || "Sin ubicación",
          listingCondition: listing ? conditionLabels[listing.condition] : "Sin estado",
          listingImageUrl: firstImage ? imageUrls.get(firstImage.storage_path) || placeholderImage : placeholderImage,
          sellerName: seller?.full_name || seller?.username || "Vendedor",
          reporterName: reporter?.full_name || reporter?.username || "Usuario",
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const updateReportStatus = async (reportId: string, status: ReportStatus) => {
    const { error } = await db.from("reports").update({ status }).eq("id", reportId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setReports((current) => current.filter((report) => report.id !== reportId));
    toast.success("Reporte actualizado.");
  };

  const hideListing = async (report: ReportView) => {
    const { error } = await db.from("listings").update({ status: "draft" }).eq("id", report.listing_id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Anuncio ocultado como borrador.");
    setReports((current) =>
      current.map((item) => (item.id === report.id ? { ...item, listingStatus: "draft" } : item))
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando reportes...</section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Acceso restringido</h1>
          <p className="text-muted-foreground mb-8">Esta sección solo está disponible para administradores.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth">
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-12 md:py-20">
        <div className="mb-8">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Admin</span>
          <h1 className="font-serif text-3xl md:text-5xl mt-3">Reportes pendientes</h1>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No hay reportes pendientes.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <article key={report.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="grid gap-5 lg:grid-cols-[160px_1fr_auto] lg:items-start">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted border border-border/60">
                    <img src={report.listingImageUrl} alt={report.listingTitle} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <div className="text-sm text-primary font-medium">{reasonLabels[report.reason]}</div>
                    <h2 className="font-serif text-2xl mt-1">{report.listingTitle}</h2>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2 mt-4 text-sm">
                      <Info label="Precio" value={formatPrice(report.listingPriceCents)} />
                      <Info label="Talla" value={report.listingSize} />
                      <Info label="Ubicación" value={report.listingLocation} />
                      <Info label="Estado" value={report.listingCondition} />
                    </div>

                    <div className="text-sm text-muted-foreground mt-4 space-y-1">
                      <div>Vendedor: <span className="text-foreground font-medium">{report.sellerName}</span></div>
                      <div>Reportado por: <span className="text-foreground font-medium">{report.reporterName}</span></div>
                      <div>Estado del anuncio: <span className="text-foreground font-medium">{report.listingStatus}</span></div>
                      <div>Fecha del reporte: <span className="text-foreground font-medium">{new Date(report.created_at).toLocaleString("es-ES")}</span></div>
                    </div>

                    {report.message && (
                      <div className="mt-4 rounded-xl border border-border/60 bg-background p-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Comentario del usuario</div>
                        <p className="text-sm text-foreground/80 whitespace-pre-line">{report.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                    <Link to={`/producto/${report.listing_id}`} className="px-4 py-2 rounded-full border border-border bg-background text-foreground text-sm font-medium text-center hover:border-primary/50 hover:text-primary transition-smooth">
                      Ver anuncio
                    </Link>
                    <button type="button" onClick={() => updateReportStatus(report.id, "reviewed")} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-deep transition-smooth">
                      Marcar revisado
                    </button>
                    <button type="button" onClick={() => updateReportStatus(report.id, "dismissed")} className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-smooth">
                      Desestimar
                    </button>
                    <button type="button" onClick={() => hideListing(report)} className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 transition-smooth">
                      Ocultar anuncio
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/60 bg-background p-3">
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    <div className="font-medium text-foreground">{value}</div>
  </div>
);

export default AdminReports;
