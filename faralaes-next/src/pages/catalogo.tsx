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
  whatsappContactAllowed: boolean;
  images?: {
    url: string;
  }[];
};

const precioAcentimos = (valor: string) => {
  if (!valor.trim()) return null;

  const normalizado = valor.trim().replace(",", ".");
  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return Math.round(numero * 100);
};

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFavoritos, setProductosFavoritos] = useState<Producto[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [ubicacion, setUbicacion] = useState("");
  const [talla, setTalla] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloWhatsapp, setSoloWhatsapp] = useState(false);
  const [soloEnvio, setSoloEnvio] = useState(false);
  const [orden, setOrden] = useState("recientes");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        const productosRes = await fetch("/api/productos");
        const productosData = await productosRes.json();
        setProductos(productosData);

        const meRes = await fetch("/api/me");

        if (meRes.ok) {
          const user = await meRes.json();
          setUserId(user.id);

          const favoritosRes = await fetch("/api/favoritos");

          if (!favoritosRes.ok) return;

          const favoritosData: Producto[] = await favoritosRes.json();
          setProductosFavoritos(favoritosData);
          setFavoritos(favoritosData.map((producto) => producto.id));
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
      body: JSON.stringify({ listingId }),
    });

    if (!res.ok) {
      setFavoritos((prev) =>
        estaGuardado
          ? [...prev, listingId]
          : prev.filter((id) => id !== listingId)
      );

      if (res.status === 401) {
        router.push("/login");
      }
    }
  };

  const renderProductoCard = (p: Producto) => (
    <article
      key={p.id}
      onClick={() => abrirProducto(p)}
      className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
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
            favoritos.includes(p.id) ? "Quitar de favoritos" : "Guardar en favoritos"
          }
        >
          <span className={favoritos.includes(p.id) ? "text-red-600" : "text-gray-500"}>
            ♥
          </span>
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
          <p className="mb-3 text-sm text-gray-600">{p.description}</p>
        )}

        <p className="mb-3 text-2xl font-semibold text-red-700">
          {formatPrice(p.priceCents)}
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
  );

  const precioMinCents = precioAcentimos(precioMin);
  const precioMaxCents = precioAcentimos(precioMax);
  const productosFiltrados = productos
    .filter((producto) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideTexto =
        !texto ||
        producto.title.toLowerCase().includes(texto) ||
        (producto.description || "").toLowerCase().includes(texto);
      const coincideCategoria =
        categoria === "todas" || producto.category === categoria;
      const coincideUbicacion =
        !ubicacion.trim() ||
        (producto.location || "")
          .toLowerCase()
          .includes(ubicacion.trim().toLowerCase());
      const coincideTalla =
        !talla.trim() ||
        (producto.size || "").toLowerCase().includes(talla.trim().toLowerCase());
      const coincidePrecioMin =
        precioMinCents === null || producto.priceCents >= precioMinCents;
      const coincidePrecioMax =
        precioMaxCents === null || producto.priceCents <= precioMaxCents;
      const coincideWhatsapp =
        !soloWhatsapp || producto.whatsappContactAllowed;
      const coincideEnvio = !soloEnvio || producto.shippingAvailable;

      return (
        coincideTexto &&
        coincideCategoria &&
        coincideUbicacion &&
        coincideTalla &&
        coincidePrecioMin &&
        coincidePrecioMax &&
        coincideWhatsapp &&
        coincideEnvio
      );
    })
    .sort((a, b) => {
      if (orden === "precio-asc") {
        return a.priceCents - b.priceCents;
      }

      if (orden === "precio-desc") {
        return b.priceCents - a.priceCents;
      }

      return 0;
    });
  const ultimosAnuncios = productos.slice(0, 4);
  const idsUltimosAnuncios = new Set(ultimosAnuncios.map((producto) => producto.id));
  const categoriasFavoritas = new Set(
    productosFavoritos.map((producto) => producto.category).filter(Boolean)
  );
  const ubicacionesFavoritas = new Set(
    productosFavoritos
      .map((producto) => producto.location?.trim().toLowerCase())
      .filter((location): location is string => Boolean(location))
  );
  const idsFavoritos = new Set(favoritos);
  const recomendacionesRelacionadas = userId
    ? productos.filter((producto) => {
        if (idsUltimosAnuncios.has(producto.id) || idsFavoritos.has(producto.id)) {
          return false;
        }

        const mismaCategoria = categoriasFavoritas.has(producto.category);
        const mismaUbicacion = producto.location
          ? ubicacionesFavoritas.has(producto.location.trim().toLowerCase())
          : false;

        return mismaCategoria || mismaUbicacion;
      })
    : [];
  const recomendacionesFallback = productos.filter(
    (producto) =>
      !idsUltimosAnuncios.has(producto.id) &&
      !idsFavoritos.has(producto.id) &&
      !recomendacionesRelacionadas.some(
        (recomendacion) => recomendacion.id === producto.id
      )
  );
  const puedeInteresarte = [
    ...recomendacionesRelacionadas,
    ...recomendacionesFallback,
  ].slice(0, 4);

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
              Mostrando {productosFiltrados.length} de {productos.length} prendas publicadas.
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

        {!loading && productos.length > 0 && (
          <div className="mb-10 space-y-10">
            {ultimosAnuncios.length > 0 && (
              <section>
                <h2 className="font-serif text-3xl text-gray-950">
                  Últimos anuncios publicados
                </h2>
                <div className="mt-5 -mx-6 flex gap-5 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
                  {ultimosAnuncios.map((producto) => (
                    <div key={producto.id} className="min-w-[260px] sm:min-w-0">
                      {renderProductoCard(producto)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {puedeInteresarte.length > 0 && (
              <section>
                <h2 className="font-serif text-3xl text-gray-950">
                  Puede interesarte
                </h2>
                <div className="mt-5 -mx-6 flex gap-5 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
                  {puedeInteresarte.map((producto) => (
                    <div key={producto.id} className="min-w-[260px] sm:min-w-0">
                      {renderProductoCard(producto)}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && productos.length > 0 && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <input
                className="rounded border border-gray-300 p-3"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título o descripción"
              />
              <select
                className="rounded border border-gray-300 p-3"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                <option value="traje">Traje</option>
                <option value="zapatos">Zapatos</option>
                <option value="mantoncillo">Mantoncillo</option>
                <option value="complementos">Complementos</option>
              </select>
              <input
                className="rounded border border-gray-300 p-3"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ubicación"
              />
              <input
                className="rounded border border-gray-300 p-3"
                value={talla}
                onChange={(e) => setTalla(e.target.value)}
                placeholder="Talla"
              />
              <input
                className="rounded border border-gray-300 p-3"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                placeholder="Precio mínimo"
                type="text"
                inputMode="decimal"
              />
              <input
                className="rounded border border-gray-300 p-3"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                placeholder="Precio máximo"
                type="text"
                inputMode="decimal"
              />
              <select
                className="rounded border border-gray-300 p-3"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recientes">Más recientes</option>
                <option value="precio-asc">Precio menor a mayor</option>
                <option value="precio-desc">Precio mayor a menor</option>
              </select>
              <div className="flex flex-col justify-center gap-2 rounded border border-gray-200 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={soloWhatsapp}
                    onChange={(e) => setSoloWhatsapp(e.target.checked)}
                  />
                  Solo con WhatsApp permitido
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={soloEnvio}
                    onChange={(e) => setSoloEnvio(e.target.checked)}
                  />
                  Solo con envío disponible
                </label>
              </div>
            </div>
          </div>
        )}

        {!loading && productos.length > 0 && productosFiltrados.length === 0 && (
          <p>No se han encontrado anuncios con esos filtros.</p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productosFiltrados.map((p) => renderProductoCard(p))}
        </div>
        </section>
      </main>
    </>
  );
}
