import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";
import { formatPrice } from "../lib/formatPrice";

type Producto = {
  id: string;
  title: string;
  priceCents: number;
  location: string | null;
  images?: {
    url: string;
  }[];
};

export default function Home() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/productos")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Producto[]) => {
        setProductos(data.slice(0, 4));
      })
      .catch(() => {
        setProductos([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef]">
        <section className="mx-auto max-w-6xl px-6 py-16 text-center md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Faralaes
          </p>

          <h1 className="mx-auto mt-4 max-w-4xl font-serif text-5xl leading-tight text-gray-950 md:text-6xl">
            Compra y vende trajes de flamenca en Sevilla
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Encuentra trajes cerca de ti o publica el tuyo en menos de 1 minuto.
            Gratis y sin comisiones.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/publicar")}
              className="rounded-full bg-green-700 px-7 py-3 font-bold text-white shadow-sm transition hover:bg-green-800"
            >
              Publicar anuncio GRATIS
            </button>
            <button
              type="button"
              onClick={() => router.push("/catalogo")}
              className="rounded-full border border-gray-300 bg-white px-7 py-3 font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
            >
              Ver catálogo
            </button>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 text-sm font-bold text-red-800 sm:grid-cols-3">
            <div className="rounded-full bg-white px-4 py-3 shadow-sm">
              Solo en Sevilla
            </div>
            <div className="rounded-full bg-white px-4 py-3 shadow-sm">
              Sin comisiones
            </div>
            <div className="rounded-full bg-white px-4 py-3 shadow-sm">
              Publica en 1 minuto
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Catálogo
              </p>
              <h2 className="mt-2 font-serif text-4xl text-gray-950">
                Últimos trajes publicados
              </h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/catalogo")}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
            >
              Ver todos
            </button>
          </div>

          {loading && <p className="text-gray-600">Cargando anuncios...</p>}

          {!loading && productos.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="mx-auto max-w-xl text-gray-700">
                Todavía no hay anuncios publicados. Sé la primera persona en
                publicar un traje.
              </p>
              <button
                type="button"
                onClick={() => router.push("/publicar")}
                className="mt-5 rounded-full bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
              >
                Publicar anuncio GRATIS
              </button>
            </div>
          )}

          {!loading && productos.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {productos.map((producto) => (
                <article
                  key={producto.id}
                  onClick={() => router.push(`/producto/${producto.id}`)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-gray-100">
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
                    <h3 className="mb-2 font-serif text-xl text-gray-950">
                      {producto.title}
                    </h3>
                    <p className="text-2xl font-bold text-red-700">
                      {formatPrice(producto.priceCents)}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {producto.location || "Sevilla"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="border-y border-red-100 bg-white px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-serif text-4xl text-gray-950">
              ¿Cómo funciona Faralaes?
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  title: "Sube tu traje",
                  text: "Añade fotos, precio y detalles en menos de 1 minuto.",
                },
                {
                  title: "Recibe interesados",
                  text: "Las personas interesadas pueden contactar contigo directamente.",
                },
                {
                  title: "Véndelo",
                  text: "Sin comisiones ni intermediarios.",
                },
              ].map((paso, index) => (
                <div
                  key={paso.title}
                  className="rounded-2xl border border-gray-200 bg-[#f8f3ef] p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-800 font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-gray-950">
                    {paso.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-gray-600">
                    {paso.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-serif text-4xl text-gray-950">
            Por qué usar Faralaes
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Solo moda flamenca",
              "Enfocado en Sevilla",
              "Sin comisiones",
              "Rápido y sencillo",
            ].map((beneficio) => (
              <div
                key={beneficio}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-center font-bold text-red-800 shadow-sm"
              >
                {beneficio}
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-4xl rounded-3xl bg-red-900 px-6 py-12 text-center text-white shadow-sm">
            <h2 className="font-serif text-4xl">
              ¿Tienes un traje guardado en el armario?
            </h2>
            <button
              type="button"
              onClick={() => router.push("/publicar")}
              className="mt-7 rounded-full bg-green-700 px-7 py-3 font-bold text-white transition hover:bg-green-800"
            >
              Publícalo ahora gratis
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
