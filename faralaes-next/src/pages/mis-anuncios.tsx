import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { formatPrice } from "../lib/formatPrice";

type Producto = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
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

export default function MisAnuncios() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/productos?mine=true")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
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
  }, [router]);

  const eliminarProducto = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    e.stopPropagation();

    const confirmado = confirm("¿Seguro que quieres eliminar este anuncio?");

    if (!confirmado) {
      return;
    }

    const res = await fetch("/api/productos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setProductos((prev) => prev.filter((producto) => producto.id !== id));
      return;
    }

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    setError("No se ha podido eliminar el anuncio.");
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
                  <h2 className="mb-2 font-serif text-xl">
                    {producto.title}
                  </h2>

                  {producto.description && (
                    <p className="mb-3 text-sm text-gray-600">
                      {producto.description}
                    </p>
                  )}

                  <p className="mb-3 text-2xl font-semibold text-red-700">
                    {formatPrice(producto.priceCents)}
                  </p>

                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Categoría: {producto.category}</p>
                    <p>Talla: {producto.size || "Única"}</p>
                    <p>Color: {producto.color || "Sin color"}</p>
                    <p>Ubicación: {producto.location || "Sin ubicación"}</p>
                    <p>Estado: {producto.condition || "No indicado"}</p>
                    {producto.shippingAvailable && <p>Envío disponible</p>}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
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
