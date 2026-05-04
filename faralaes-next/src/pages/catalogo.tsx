import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";
import { formatPrice } from "../lib/formatPrice";

type Producto = {
  id: string;
  sellerId: string;
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
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || "";
    setUserId(storedUserId);

    const cargarCatalogo = async () => {
      try {
        const productosRes = await fetch("/api/productos");
        const productosData = await productosRes.json();
        setProductos(productosData);

        if (storedUserId) {
          const favoritosRes = await fetch(
            `/api/favoritos?userId=${encodeURIComponent(storedUserId)}`
          );

          if (favoritosRes.ok) {
            const favoritosData: Producto[] = await favoritosRes.json();
            setFavoritos(favoritosData.map((producto) => producto.id));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    cargarCatalogo();
  }, []);

  const abrirProducto = (producto: Producto) => {
    if (userId && producto.sellerId === userId) {
      router.push(`/editar/${producto.id}`);
      return;
    }

    router.push(`/producto/${producto.id}`);
  };

  const toggleFavorito = async (
    e: React.MouseEvent<HTMLButtonElement>,
    listingId: string
  ) => {
    e.stopPropagation();

    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const estaGuardado = favoritos.includes(listingId);

    setFavoritos((prev) =>
      estaGuardado
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );

    const res = await fetch("/api/favoritos", {
      method: estaGuardado ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, listingId }),
    });

    if (!res.ok) {
      setFavoritos((prev) =>
        estaGuardado
          ? [...prev, listingId]
          : prev.filter((id) => id !== listingId)
      );
    }
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-red-700 font-semibold">
              Catálogo
            </p>

            <h1 className="text-4xl md:text-5xl font-serif mt-3 mb-4">
              Prendas seleccionadas a mano
            </h1>

            <p className="text-gray-600">
              Mostrando {productos.length} prendas publicadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/mis-anuncios")}
            className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Mis anuncios
          </button>
        </div>

        {loading && <p>Cargando prendas...</p>}

        {!loading && productos.length === 0 && (
          <p>No hay anuncios publicados.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map((p) => (
            <article
              key={p.id}
              onClick={() => abrirProducto(p)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-lg transition"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-200">
                {userId && p.sellerId === userId && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-green-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                    Tu anuncio
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => toggleFavorito(e, p.id)}
                  className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-3xl leading-none shadow-md transition hover:scale-105"
                  aria-label={
                    favoritos.includes(p.id)
                      ? "Quitar de favoritos"
                      : "Guardar en favoritos"
                  }
                >
                  <span
                    className={
                      favoritos.includes(p.id)
                        ? "text-red-600"
                        : "text-gray-500"
                    }
                  >
                    ♥
                  </span>
                </button>

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
                  {formatPrice(p.priceCents)}
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
    </>
  );
}
