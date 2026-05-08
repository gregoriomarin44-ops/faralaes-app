import Link from "next/link";
import { FormEvent, useState } from "react";
import NavBar from "../components/NavBar";

const GENERIC_MESSAGE =
  "Si existe una cuenta con ese email, te hemos enviado instrucciones.";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/recuperar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se ha podido procesar la solicitud.");
      }

      setMessage(data?.message || GENERIC_MESSAGE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se ha podido procesar la solicitud."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Faralaes
          </p>
          <h1 className="mt-3 font-serif text-4xl text-gray-950">
            Recuperar contraseña
          </h1>
          <p className="mt-3 text-gray-600">
            Introduce tu email y te enviaremos un enlace para crear una
            contraseña nueva.
          </p>

          <form onSubmit={requestReset} className="mt-8 space-y-4">
            <input
              className="w-full rounded border border-gray-300 p-3 outline-none transition focus:border-green-700"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              type="email"
              autoComplete="email"
              required
            />

            <button
              className="w-full rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              type="submit"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar instrucciones"}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <Link
            href="/login"
            className="mt-6 inline-flex w-full justify-center rounded border border-green-700 bg-white p-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            Volver al login
          </Link>
        </section>
      </main>
    </>
  );
}
