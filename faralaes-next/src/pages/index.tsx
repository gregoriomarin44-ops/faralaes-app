import { useRouter } from "next/router";
import NavBar from "../components/NavBar";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-16">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Faralaes
          </p>

          <h1 className="mt-4 font-serif text-5xl text-gray-950 md:text-6xl">
            Compra y vende moda flamenca de segunda mano
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Encuentra trajes, zapatos, mantoncillos y complementos publicados
            por otros usuarios, o sube tus propios anuncios en unos minutos.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/catalogo")}
              className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Ver catálogo
            </button>
            <button
              type="button"
              onClick={() => router.push("/publicar")}
              className="rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
            >
              Publicar anuncio
            </button>
            <button
              type="button"
              onClick={() => router.push("/mis-anuncios")}
              className="rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
            >
              Mis anuncios
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
            >
              Entrar
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
