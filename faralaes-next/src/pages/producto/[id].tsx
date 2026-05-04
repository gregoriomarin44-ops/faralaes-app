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
  images?: { url: string }[];
};

export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    fetch(`/api/productos/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then((data) => {
        setProducto(data);
        setError("");
      })
      .catch(() => {
        setProducto(null);
        setError("No se ha podido cargar el anuncio.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <p className="text-center text-gray-600">Cargando anuncio...</p>
      </main>
    );
  }

  if (error || !producto) {
    return (
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="max-w-3xl mx-auto bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <p className="text-gray-700 mb-6">{error || "Producto no encontrado."}</p>
          <button
            onClick={() => router.push("/catalogo")}
            className="bg-green-700 text-white px-6 py-3 rounded-full font-semibold"
          >
            Volver al catálogo
          </button>
        </section>
      </main>
    );
  }

  const whatsappText = encodeURIComponent(
    `Hola, me interesa este anuncio de Faralaes:\n\n${producto.title}\nPrecio: ${(producto.priceCents / 100).toFixed(2)} €\nUbicación: ${producto.location || "Sin ubicación"}`
  );

  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
      <section className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push("/catalogo")}
          className="mb-6 text-sm text-green-700 font-semibold hover:underline"
        >
          ← Volver al catálogo
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 grid md:grid-cols-2 gap-8">
          <div className="aspect-[4/5] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
            {producto.images?.[0]?.url ? (
              <img
                src={producto.images[0].url}
                alt={producto.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400">Sin imagen</span>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-sm uppercase tracking-widest text-red-700 font-semibold mb-3">
              {producto.category}
            </p>

            <h1 className="font-serif text-4xl mb-3">
              {producto.title}
            </h1>

            {producto.description && (
              <p className="text-gray-600 mb-5 leading-relaxed">
                {producto.description}
              </p>
            )}

            <p className="text-4xl font-semibold text-red-700 mb-8">
              {(producto.priceCents / 100).toFixed(2)} €
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-8">
              <p><strong>Categoría:</strong> {producto.category}</p>
              <p><strong>Talla:</strong> {producto.size || "Única"}</p>
              <p><strong>Color:</strong> {producto.color || "Sin color"}</p>
              <p><strong>Ubicación:</strong> {producto.location || "Sin ubicación"}</p>
              <p><strong>Estado:</strong> {producto.condition || "No indicado"}</p>
              <p><strong>Envío:</strong> {producto.shippingAvailable ? "Disponible" : "No indicado"}</p>
            </div>

            <a
              href={`https://wa.me/34633195730?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-full font-semibold text-center transition"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}