import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUserAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

type ListingStatus = "draft" | "published" | "reserved" | "sold" | "archived" | "rejected" | "pending";

type Listing = {
  id: string;
  title: string;
  seller_id: string;
  status: ListingStatus;
  published_at: string | null;
  created_at: string;
};

type SellerProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  phone_verified: boolean | null;
  seller_badge: string | null;
};

type ListingView = Listing & {
  sellerName: string;
  sellerPhoneVerified: boolean;
  sellerFeatured: boolean;
};

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

type ReportView = Report & {
  listingTitle: string;
};

const statusLabels: Record<ListingStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  reserved: "Reservado",
  sold: "Vendido",
  archived: "Archivado",
  rejected: "Rechazado",
  pending: "Pendiente",
};

const reasonLabels: Record<Report["reason"], string> = {
  inappropriate: "Contenido inapropiado",
  scam: "Posible estafa",
  wrong_item: "Artículo incorrecto",
  other: "Otro",
};

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [reports, setReports] = useState<ReportView[]>([]);
  const [reportsAvailable, setReportsAvailable] = useState(true);

  const db = supabase as any;

  const loadAdminData = async () => {
    setLoading(true);

    const { isAdmin: admin } = await getCurrentUserAdmin();
    setIsAdmin(admin);

    if (!admin) {
      setLoading(false);
      return;
    }

    const { data: listingsData, error: listingsError } = await db
      .from("listings")
      .select("id,title,seller_id,status,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20);

    if (listingsError) {
      toast.error(listingsError.message);
      setLoading(false);
      return;
    }

    const listingRows = (listingsData || []) as Listing[];
    const sellerIds = Array.from(new Set(listingRows.map((listing) => listing.seller_id)));
    const sellers = new Map<string, SellerProfile>();

    if (sellerIds.length > 0) {
      const { data: sellersData, error: sellersError } = await db
        .from("profiles")
        .select("id,full_name,username,phone_verified,seller_badge")
        .in("id", sellerIds);

      if (sellersError) {
        toast.error(sellersError.message);
      } else {
        (sellersData || []).forEach((seller: SellerProfile) => sellers.set(seller.id, seller));
      }
    }

    setListings(
      listingRows.map((listing) => {
        const seller = sellers.get(listing.seller_id);

        return {
          ...listing,
          sellerName: seller?.full_name || seller?.username || "Vendedor",
          sellerPhoneVerified: Boolean(seller?.phone_verified),
          sellerFeatured: seller?.seller_badge === "featured",
        };
      })
    );

    await loadReports();
    setLoading(false);
  };

  const loadReports = async () => {
    const { data, error } = await db
      .from("reports")
      .select("id,listing_id,reporter_id,reason,message,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setReportsAvailable(false);
      setReports([]);
      return;
    }

    setReportsAvailable(true);

    const rows = (data || []) as Report[];
    const listingIds = Array.from(new Set(rows.map((report) => report.listing_id)));
    const titles = new Map<string, string>();

    if (listingIds.length > 0) {
      const { data: listingsData } = await db
        .from("listings")
        .select("id,title")
        .in("id", listingIds);

      (listingsData || []).forEach((listing: { id: string; title: string }) => titles.set(listing.id, listing.title));
    }

    setReports(
      rows.map((report) => ({
        ...report,
        listingTitle: titles.get(report.listing_id) || "Anuncio no disponible",
      }))
    );
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const updateListingStatus = async (listingId: string, status: "draft" | "sold") => {
    const { error } = await db.from("listings").update({ status }).eq("id", listingId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setListings((current) =>
      current.map((listing) => (listing.id === listingId ? { ...listing, status } : listing))
    );
    toast.success(status === "draft" ? "Anuncio ocultado." : "Anuncio marcado como vendido.");
  };

  const updateReportStatus = async (reportId: string, status: ReportStatus) => {
    const { error } = await db.from("reports").update({ status }).eq("id", reportId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setReports((current) => current.filter((report) => report.id !== reportId));
    toast.success("Reporte actualizado.");
  };

  const updateSellerTrust = async (sellerId: string, changes: { phone_verified?: boolean; seller_badge?: "featured" | null }) => {
    const { data, error } = await db
      .from("profiles")
      .update(changes)
      .eq("id", sellerId)
      .select("id,phone_verified,seller_badge")
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      return;
    }

    console.log("[Admin] seller trust updated", { sellerId, changes, data });

    if (!data) {
      toast.error("No se encontró el perfil del vendedor para actualizar.");
      return;
    }

    setListings((current) =>
      current.map((listing) =>
        listing.seller_id === sellerId
          ? {
              ...listing,
              sellerPhoneVerified: Boolean(data.phone_verified),
              sellerFeatured: data.seller_badge === "featured",
            }
          : listing
      )
    );
    toast.success(
      `Vendedor actualizado: teléfono ${data.phone_verified ? "verificado" : "no verificado"}, ${
        data.seller_badge === "featured" ? "destacado" : "sin destacado"
      }.`
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando administración...</section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">No autorizado</h1>
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
        <div className="mb-10">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Admin</span>
          <h1 className="font-serif text-3xl md:text-5xl mt-3">Panel de administración</h1>
        </div>

        <section className="mb-12">
          <div className="flex items-end justify-between gap-4 mb-5">
            <h2 className="font-serif text-2xl md:text-3xl">Últimos anuncios publicados</h2>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
              No hay anuncios publicados.
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <article key={listing.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl">{listing.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        Vendedor: {listing.sellerName} · Estado: {statusLabels[listing.status]} · {listing.published_at ? new Date(listing.published_at).toLocaleString("es-ES") : "Sin fecha"}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => updateSellerTrust(listing.seller_id, { phone_verified: !listing.sellerPhoneVerified })}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-smooth ${
                            listing.sellerPhoneVerified
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {listing.sellerPhoneVerified ? "Teléfono verificado" : "Marcar teléfono verificado"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSellerTrust(listing.seller_id, { seller_badge: listing.sellerFeatured ? null : "featured" })}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-smooth ${
                            listing.sellerFeatured
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {listing.sellerFeatured ? "Vendedor destacado" : "Marcar destacado"}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => updateListingStatus(listing.id, "draft")} className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 transition-smooth">
                        Ocultar anuncio
                      </button>
                      <button type="button" onClick={() => updateListingStatus(listing.id, "sold")} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-deep transition-smooth">
                        Marcar vendido
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-5">
            <h2 className="font-serif text-2xl md:text-3xl">Reportes pendientes</h2>
            <Link to="/admin/reports" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>

          {!reportsAvailable ? (
            <div className="bg-card border border-border rounded-2xl p-5 text-muted-foreground">
              La tabla `reports` todavía no está disponible. Aplica la migración de moderación para activar esta sección.
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
              No hay reportes pendientes.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article key={report.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="text-sm text-primary font-medium">{reasonLabels[report.reason]}</div>
                      <h3 className="font-serif text-xl mt-1">{report.listingTitle}</h3>
                      {report.message && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{report.message}</p>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => updateReportStatus(report.id, "reviewed")} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-deep transition-smooth">
                        Revisado
                      </button>
                      <button type="button" onClick={() => updateReportStatus(report.id, "dismissed")} className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-smooth">
                        Desestimar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Admin;
