import { useEffect, useState } from "react";

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

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
      <section className="max-w-6xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-red-700 font-semibold">
          Catálogo
        </p>

        <h1 className="text-4xl md:text-5xl font-serif mt-3 mb-4">
          Prendas seleccionadas a mano
        </h1>

        <p className="text-gray-600 mb-10">
          Mostrando {productos.length} prendas publicadas.
        </p>

        {loading && <p>Cargando prendas...</p>}

        {!loading && productos.length === 0 && (
          <p>No hay anuncios publicados.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-200">
                {p.images?.[0]?.url ? (
                  <img
                    src={p.images[0].url}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="font-serif text-xl mb-2">{p.title}</h2>

                {p.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {p.description}
                  </p>
                )}

                <p className="text-2xl font-semibold text-red-700 mb-3">
                  {(p.priceCents / 100).toFixed(2)} €
                </p>

                <div className="text-sm text-gray-500 space-y-1">
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
  );
}