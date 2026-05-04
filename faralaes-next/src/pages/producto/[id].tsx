import { useRouter } from "next/router";
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

export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/productos/${id}`)
      .then((res) => res.json())
      .then((data) => setProducto(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <p>Cargando producto...</p>
      </main>
    );
  }

  if (!producto) {
    return (
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <p>Producto no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
      <section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="aspect-[4/5] overflow-hidden bg-gray-200 rounded-xl">
          {producto.images?.[0]?.url ? (
            <img
              src={producto.images[0].url}
              alt={producto.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-3">
            {producto.category}
          </p>

          <h1 className="font-serif text-4xl mb-4">{producto.title}</h1>

          <p className="text-3xl font-semibold text-green-700 mb-6">
            {(producto.priceCents / 100).toFixed(2)} €
          </p>

          {producto.description && (
            <p className="text-gray-700 mb-6 leading-relaxed">
              {producto.description}
            </p>
          )}

          <div className="space-y-2 text-gray-600 mb-8">
            <p><strong>Talla:</strong> {producto.size || "Única"}</p>
            <p><strong>Color:</strong> {producto.color || "Sin color"}</p>
            <p><strong>Ubicación:</strong> {producto.location || "Sin ubicación"}</p>
            <p><strong>Estado:</strong> {producto.condition || "No indicado"}</p>
            {producto.shippingAvailable && <p><strong>Envío:</strong> disponible</p>}
          </div>

          <a
            href={`https://wa.me/34633195730?text=${encodeURIComponent(
              `Hola, me interesa este anuncio de Faralaes: ${producto.title}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full justify-center rounded-full bg-green-700 px-6 py-3 text-white font-semibold hover:bg-green-800"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}