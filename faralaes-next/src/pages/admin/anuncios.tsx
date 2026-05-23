import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";
import { formatPrice } from "../../lib/formatPrice";
import { getDiscountPercent } from "../../lib/pricing";

type AdminListing = {
  id: string;
  title: string;
  priceCents: number;
  previousPriceCents: number | null;
  status: string;
  createdAt: string;
  seller: {
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function AdminListings() {
  const session = useAdminSession();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.status !== "authorized") {
      return;
    }

    fetch(`/api/admin/listings?userId=${encodeURIComponent(session.userId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido cargar los anuncios.");
        }

        return res.json() as Promise<AdminListing[]>;
      })
      .then((data) => {
        setListings(data);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const updateListing = async (
    listingId: string,
    action: "hide" | "publish" | "sold"
  ) => {
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, listingId, action }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "No se ha podido actualizar el anuncio.");
      return;
    }

    setListings((prev) =>
      prev.map((listing) => (listing.id === listingId ? data : listing))
    );
    setError("");
  };

  return (
    <AdminLayout
      session={session}
      title="Anuncios"
      description="Listado completo de prendas con acciones de moderacion y estado de publicacion."
    >
      {error && (
        <p className="mb-5 rounded-lg border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Titulo</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="align-top">
                  <td className="px-4 py-4 font-semibold text-stone-950">
                    {listing.title}
                  </td>
                  <td className="px-4 py-4 text-red-700">
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      {formatPrice(listing.priceCents)}
                      {getDiscountPercent(
                        listing.priceCents,
                        listing.previousPriceCents
                      ) !== null && (
                        <span className="rounded-full bg-red-700 px-2 py-0.5 text-[11px] font-black text-white">
                          -
                          {getDiscountPercent(
                            listing.priceCents,
                            listing.previousPriceCents
                          )}
                          %
                        </span>
                      )}
                    </div>
                    {getDiscountPercent(
                      listing.priceCents,
                      listing.previousPriceCents
                    ) !== null && (
                      <p className="mt-1 text-xs font-bold text-stone-400 line-through">
                        {formatPrice(listing.previousPriceCents || 0)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#f8f3ef] px-3 py-1 text-xs font-bold text-stone-700">
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-stone-600">
                    <span className="block font-semibold text-stone-800">
                      {listing.seller.profile?.displayName || "Sin perfil"}
                    </span>
                    {listing.seller.email}
                  </td>
                  <td className="px-4 py-4 text-stone-600">
                    {formatDate(listing.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      <Link
                        href={`/producto/${listing.id}?adminUserId=${encodeURIComponent(
                          session.userId
                        )}`}
                        className="rounded-lg border border-stone-200 px-3 py-2 font-semibold text-stone-700 transition hover:border-green-700 hover:text-green-800"
                      >
                        Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(
                            listing.id,
                            listing.status === "published" ? "hide" : "publish"
                          )
                        }
                        className="rounded-lg border border-stone-200 px-3 py-2 font-semibold text-stone-700 transition hover:border-red-700 hover:text-red-700"
                      >
                        {listing.status === "published" ? "Ocultar" : "Publicar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateListing(listing.id, "sold")}
                        disabled={listing.status === "sold"}
                        className="rounded-lg bg-green-700 px-3 py-2 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        Vendido
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <p className="px-5 py-4 text-sm text-stone-500">
            Cargando anuncios...
          </p>
        )}

        {!loading && listings.length === 0 && (
          <p className="px-5 py-4 text-sm text-stone-500">
            Todavia no hay anuncios.
          </p>
        )}
      </section>
    </AdminLayout>
  );
}
