import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/productos/${id}`)
      .then((res) => res.json())
      .then((data) => setProducto(data));
  }, [id]);

  if (!producto) return <p className="text-center mt-10">Cargando...</p>;

  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
      <section className="max-w-5xl mx-auto bg-white rounded-2xl shadow-soft p-6 grid md:grid-cols-2 gap-8">

        {/* IMAGEN */}
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

        {/* INFO */}
        <div>
          <h1 className="font-serif text-3xl mb-2">
            {producto.title}
          </h1>

          <p className="text-gray-600 mb-4">
            {producto.description}
          </p>

          <p className="text-3xl font-semibold text-red-700 mb-6">
            {(producto.priceCents / 100).toFixed(2)} €
          </p>

          <div className="text-sm text-gray-500 space-y-2 mb-6">
            <p><strong>Talla:</strong> {producto.size || "Única"}</p>
            <p><strong>Color:</strong> {producto.color || "Sin color"}</p>
            <p><strong>Ubicación:</strong> {producto.location || "Sin ubicación"}</p>
            <p><strong>Estado:</strong> {producto.condition || "No indicado"}</p>
          </div>

          {/* BOTÓN */}
          <button className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-full font-semibold transition">
            Contactar por WhatsApp
          </button>
        </div>

      </section>
    </main>
  );
}