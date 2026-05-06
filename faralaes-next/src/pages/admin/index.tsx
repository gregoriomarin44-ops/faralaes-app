import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";
import { formatPrice } from "../../lib/formatPrice";

type DashboardListing = {
  id: string;
  title: string;
  priceCents: number;
  status: string;
  createdAt: string;
  seller: {
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
};

type DashboardUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  profile: {
    displayName: string;
  } | null;
};

type DashboardData = {
  totals: {
    totalListings: number;
    publishedListings: number;
    pendingListings: number;
    totalUsers: number;
  };
  latestListings: DashboardListing[];
  latestUsers: DashboardUser[];
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function AdminHome() {
  const session = useAdminSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.status !== "authorized") {
      return;
    }

    fetch(`/api/admin/dashboard?userId=${encodeURIComponent(session.userId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido cargar los datos del panel.");
        }

        return res.json() as Promise<DashboardData>;
      })
      .then((dashboardData) => {
        setData(dashboardData);
        setError("");
      })
      .catch((err: Error) => setError(err.message));
  }, [session]);

  const cards = [
    { label: "Anuncios totales", value: data?.totals.totalListings ?? "-" },
    { label: "Publicados", value: data?.totals.publishedListings ?? "-" },
    { label: "Pendientes/borrador", value: data?.totals.pendingListings ?? "-" },
    { label: "Usuarios registrados", value: data?.totals.totalUsers ?? "-" },
  ];

  return (
    <AdminLayout
      session={session}
      title="Resumen"
      description="Vista operativa del marketplace: actividad reciente, volumen de anuncios y altas de usuarios."
    >
      {error && (
        <p className="mb-5 rounded-lg border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-stone-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-stone-950">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="font-serif text-2xl">Ultimos anuncios</h2>
            <Link
              href="/admin/anuncios"
              className="text-sm font-semibold text-green-800 hover:text-green-900"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {data?.latestListings.map((listing) => (
              <div key={listing.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold">{listing.title}</p>
                  <p className="text-sm text-stone-500">
                    {listing.seller.profile?.displayName || listing.seller.email}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-red-700">
                    {formatPrice(listing.priceCents)}
                  </p>
                  <p className="text-sm text-stone-500">
                    {listing.status} · {formatDate(listing.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {data && data.latestListings.length === 0 && (
              <p className="px-5 py-4 text-sm text-stone-500">
                Todavia no hay anuncios.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="font-serif text-2xl">Ultimas altas</h2>
            <Link
              href="/admin/usuarios"
              className="text-sm font-semibold text-green-800 hover:text-green-900"
            >
              Ver usuarios
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {data?.latestUsers.map((user) => (
              <div key={user.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold">
                    {user.profile?.displayName || "Sin nombre publico"}
                  </p>
                  <p className="text-sm text-stone-500">{user.email}</p>
                </div>
                <div className="text-left text-sm text-stone-500 sm:text-right">
                  <p>{user.role}</p>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
              </div>
            ))}
            {data && data.latestUsers.length === 0 && (
              <p className="px-5 py-4 text-sm text-stone-500">
                Todavia no hay usuarios.
              </p>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
