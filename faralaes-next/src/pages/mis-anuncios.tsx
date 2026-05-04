import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";

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
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    fetch(`/api/productos?mine=true&userId=${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido cargar tus anuncios.");
        }

        return res.json();
      })
      .then((data) => {
        setProductos(data);
        setError("");
      })
      .catch((err: Error) => {
        setProductos([]);
        setError(err.message || "No se han podido cargar tus anuncios.");
      })
      .finally(() => setLoading(false));
  }, [router]);

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
          {productos.map((p) => (
            <article
              key={p.id}
              onClick={() => router.push(`/producto/${p.id}`)}
              className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-200">
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

                <p className="mb-3 text-2xl font-semibold text-red-700">
                  {(p.priceCents / 100).toFixed(2)} €
                </p>

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
