import NavBar from "../components/NavBar";

export default function Cookies() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-white px-6 py-12">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Legal
          </p>
          <h1 className="mt-3 font-serif text-4xl text-stone-950">
            Política de cookies
          </h1>
          <div className="mt-6 rounded-lg border border-stone-200 bg-[#f8f3ef] p-6 text-stone-700">
            <p>
              Este contenido es provisional y está pendiente de revisión legal.
            </p>
            <p className="mt-4">
              Aquí se explicará qué cookies utiliza Faralaes, con qué finalidad
              y cómo puede gestionarlas cada usuario.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
