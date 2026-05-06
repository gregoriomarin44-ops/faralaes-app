import { FormEvent, useState } from "react";
import NavBar from "../components/NavBar";

type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function Contacto() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [website, setWebsite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });

  const enviarContacto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnviando(true);
    setStatus({ type: "idle", message: "" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, mensaje, website }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No hemos podido enviar el mensaje.");
      }

      setNombre("");
      setEmail("");
      setMensaje("");
      setWebsite("");
      setStatus({
        type: "success",
        message: "Mensaje enviado. Te responderemos lo antes posible.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No hemos podido enviar el mensaje.",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
              Contacto
            </p>
            <h1 className="mt-3 font-serif text-4xl text-gray-950 md:text-5xl">
              Hablemos de Faralaes
            </h1>
            <p className="mt-4 leading-relaxed text-gray-600">
              Escríbenos si tienes dudas, sugerencias o necesitas ayuda con un
              anuncio.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_0.7fr]">
            <form
              onSubmit={enviarContacto}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre
                  <input
                    className="mt-2 w-full rounded border border-gray-300 p-3 font-normal text-gray-950 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    type="text"
                    name="nombre"
                    autoComplete="name"
                    maxLength={120}
                    required
                  />
                </label>

                <label className="block text-sm font-semibold text-gray-700">
                  Email
                  <input
                    className="mt-2 w-full rounded border border-gray-300 p-3 font-normal text-gray-950 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>

              <label className="mt-5 block text-sm font-semibold text-gray-700">
                Mensaje
                <textarea
                  className="mt-2 min-h-48 w-full resize-y rounded border border-gray-300 p-3 font-normal text-gray-950 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
                  value={mensaje}
                  onChange={(event) => setMensaje(event.target.value)}
                  name="mensaje"
                  maxLength={4000}
                  required
                />
              </label>

              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    name="website"
                    type="text"
                  />
                </label>
              </div>

              {status.type !== "idle" && (
                <p
                  className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${
                    status.type === "success"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-6 rounded-full bg-green-700 px-7 py-3 font-bold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {enviando ? "Enviando..." : "Enviar mensaje"}
              </button>
            </form>

            <aside className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Atención
              </p>
              <h2 className="mt-3 font-serif text-3xl text-gray-950">
                Estamos al otro lado
              </h2>
              <p className="mt-4 leading-relaxed text-gray-600">
                Revisamos los mensajes relacionados con anuncios, cuentas y
                propuestas para mejorar la plataforma.
              </p>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
