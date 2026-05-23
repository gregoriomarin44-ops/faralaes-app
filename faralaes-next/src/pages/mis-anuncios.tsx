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
  status?: string | null;
  views?: number | null;
  shippingAvailable: boolean;
  images?: {
    url: string;
  }[];
  _count?: {
    favorites?: number;
    conversations?: number;
  };
};

const formatMetricCount = (value: number) =>
  new Intl.NumberFormat("es-ES").format(value);

const getStatusLabel = (status?: string | null) => {
  if (status === "sold") return "Vendido";
  if (status === "reserved") return "Reservado";
  if (status === "hidden") return "Oculto";
  return "Publicado";
};

const getStatusClasses = (status?: string | null) => {
  if (status === "sold") return "border-stone-200 bg-stone-100 text-stone-700";
  if (status === "reserved") return "border-amber-100 bg-amber-50 text-amber-800";
  if (status === "hidden") return "border-gray-200 bg-gray-50 text-gray-600";
  return "border-green-100 bg-green-50 text-green-800";
};

export default function MisAnuncios() {
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

    fetch("/api/productos?mine=true")
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
          return null;
        }

        if (!res.ok) {
          throw new Error("No se han podido cargar tus anuncios.");
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
        setError(err.message || "No se han podido cargar tus anuncios.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, router, router.asPath, router.isReady, user]);

  const eliminarProducto = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    e.stopPropagation();

    const confirmado = confirm("¿Seguro que quieres eliminar este anuncio?");

    if (!confirmado) {
      return;
    }

    try {
      const res = await fetch("/api/productos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setProductos((prev) => prev.filter((producto) => producto.id !== id));
        setError("");
        return;
      }

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
        return;
      }

      const message = data?.error || "No se ha podido eliminar el anuncio.";
      console.error("No se ha podido eliminar el anuncio.", {
        listingId: id,
        status: res.status,
        error: message,
      });
      setError(message);
    } catch (err) {
      console.error("No se ha podido eliminar el anuncio.", err);
      setError("No se ha podido eliminar el anuncio.");
    }
  };

  const editarProducto = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    e.stopPropagation();
    router.push(`/editar/${id}`);
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Mis anuncios
              </p>

              <h1 className="mt-3 font-serif text-4xl md:text-5xl">
                Tus prendas publicadas
              </h1>

              <p className="mt-4 text-gray-600">
                Mostrando {productos.length} anuncios de tu cuenta.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/catalogo")}
                className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
              >
                Catálogo
              </button>
              <button
                type="button"
                onClick={() => router.push("/publicar")}
                className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Publicar
              </button>
            </div>
          </div>

          {loading && <p>Cargando tus anuncios...</p>}

          {!loading && error && <p className="text-red-700">{error}</p>}

          {!loading && !error && productos.length === 0 && (
            <p>No tienes anuncios publicados.</p>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productos.map((producto) => (
              <article
                key={producto.id}
                onClick={() => router.push(`/producto/${producto.id}`)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="aspect-[4/5] overflow-hidden bg-gray-200">
                  {producto.images?.[0]?.url ? (
                    <img
                      src={producto.images[0].url}
                      alt={producto.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="font-serif text-xl">{producto.title}</h2>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${getStatusClasses(
                        producto.status
                      )}`}
                    >
                      {getStatusLabel(producto.status)}
                    </span>
                  </div>

                  {producto.description && (
                    <p className="mb-3 text-sm text-gray-600">
                      {producto.description}
                    </p>
                  )}

                  {isDonationListing(producto.operationType) ? (
                    <p className="mb-3 text-2xl font-semibold text-red-700">
                      {getOperationLabel(producto.operationType)}
                    </p>
                  ) : (
                    <div className="mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-semibold text-red-700">
                          {formatPrice(producto.priceCents)}
                        </p>
                        {getDiscountPercent(
                          producto.priceCents,
                          producto.previousPriceCents
                        ) !== null && (
                          <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-black text-white">
                            -
                            {getDiscountPercent(
                              producto.priceCents,
                              producto.previousPriceCents
                            )}
                            %
                          </span>
                        )}
                      </div>
                      {getDiscountPercent(
                        producto.priceCents,
                        producto.previousPriceCents
                      ) !== null && (
                        <p className="text-sm font-bold text-gray-400 line-through">
                          {formatPrice(producto.previousPriceCents || 0)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Categoría: {producto.category}</p>
                    <p>Talla: {producto.size || "Única"}</p>
                    <p>Color: {producto.color || "Sin color"}</p>
                    <p>Ubicación: {producto.location || "Sin ubicación"}</p>
                    <p>Estado: {producto.condition || "No indicado"}</p>
                    {producto.shippingAvailable && <p>Envío disponible</p>}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                    <div className="rounded-xl bg-[#f8f3ef] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                        Visitas
                      </p>
                      <p className="mt-1 text-lg font-black text-stone-950">
                        {formatMetricCount(Math.max(0, producto.views || 0))}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f8f3ef] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                        Favoritos
                      </p>
                      <p className="mt-1 text-lg font-black text-stone-950">
                        {formatMetricCount(producto._count?.favorites || 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f8f3ef] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                        Mensajes
                      </p>
                      <p className="mt-1 text-lg font-black text-stone-950">
                        {formatMetricCount(producto._count?.conversations || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => editarProducto(e, producto.id)}
                      className="rounded-lg border border-green-700 bg-white px-4 py-3 text-sm font-bold text-green-700 transition hover:bg-green-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => eliminarProducto(e, producto.id)}
                      className="rounded-lg bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800"
                    >
                      Eliminar
                    </button>
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
