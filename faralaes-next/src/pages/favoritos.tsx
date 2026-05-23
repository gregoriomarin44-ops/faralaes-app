import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { useAuth } from "../lib/authContext";
import { formatPrice } from "../lib/formatPrice";
import { getOperationLabel, isDonationListing } from "../lib/listingOperation";
import { getDiscountPercent } from "../lib/pricing";

type Producto = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  previousPriceCents?: number | null;
  operationType?: string | null;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  condition: string | null;
  shippingAvailable: boolean;
  images?: {
    url: string;
  }[];
};

export default function Favoritos() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setLoading(true);

    fetch("/api/favoritos")
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
          return null;
        }

        if (!res.ok) {
          throw new Error("No se han podido cargar tus favoritos.");
        }

        return res.json();
      })
      .then((data) => {
        if (!data) {
          return;
        }

        setProductos(data);
        setError("");
      })
      .catch((err: Error) => {
        setProductos([]);
        setError(err.message || "No se han podido cargar tus favoritos.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, router, router.asPath, router.isReady, user]);

  const quitarFavorito = async (
    e: React.MouseEvent<HTMLButtonElement>,
    listingId: string
  ) => {
    e.stopPropagation();

    const anteriores = productos;
    setProductos((prev) => prev.filter((producto) => producto.id !== listingId));

    const res = await fetch("/api/favoritos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    if (!res.ok) {
      setProductos(anteriores);

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      }
    }
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Favoritos
              </p>

              <h1 className="mt-3 font-serif text-4xl md:text-5xl">
                Tus prendas guardadas
              </h1>

              <p className="mt-4 text-gray-600">
                Mostrando {productos.length} productos favoritos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/catalogo")}
              className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Ver catálogo
            </button>
          </div>

          {loading && <p>Cargando favoritos...</p>}

          {!loading && error && <p className="text-red-700">{error}</p>}

          {!loading && !error && productos.length === 0 && (
            <p>No tienes productos favoritos todavía.</p>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productos.map((p) => (
              <article
                key={p.id}
                onClick={() => router.push(`/producto/${p.id}`)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-200">
                  <button
                    type="button"
                    onClick={(e) => quitarFavorito(e, p.id)}
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl text-red-600 shadow-sm transition hover:scale-105"
                    aria-label="Quitar de favoritos"
                  >
                    ♥
                  </button>

                  {p.images?.[0]?.url ? (
                    <img
                      src={p.images[0].url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="mb-2 font-serif text-xl">{p.title}</h2>

                  {p.description && (
                    <p className="mb-3 text-sm text-gray-600">
                      {p.description}
                    </p>
                  )}

                  {isDonationListing(p.operationType) ? (
                    <p className="mb-3 text-2xl font-semibold text-red-700">
                      {getOperationLabel(p.operationType)}
                    </p>
                  ) : (
                    <div className="mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-semibold text-red-700">
                          {formatPrice(p.priceCents)}
                        </p>
                        {getDiscountPercent(p.priceCents, p.previousPriceCents) !==
                          null && (
                          <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-black text-white">
                            -
                            {getDiscountPercent(
                              p.priceCents,
                              p.previousPriceCents
                            )}
                            %
                          </span>
                        )}
                      </div>
                      {getDiscountPercent(p.priceCents, p.previousPriceCents) !==
                        null && (
                        <p className="text-sm font-bold text-gray-400 line-through">
                          {formatPrice(p.previousPriceCents || 0)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Categoría: {p.category}</p>
                    <p>Talla: {p.size || "Única"}</p>
                    <p>Color: {p.color || "Sin color"}</p>
                    <p>Ubicación: {p.location || "Sin ubicación"}</p>
                    <p>Estado: {p.condition || "No indicado"}</p>
                    {p.shippingAvailable && <p>Envío disponible</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
