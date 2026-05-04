import { useRouter } from "next/router";
import { useState } from "react";
import NavBar from "../components/NavBar";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se ha podido iniciar sesion.");
      }

      localStorage.setItem("userId", data.id);
      localStorage.setItem("userEmail", data.email);
      router.push("/catalogo");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se ha podido iniciar sesion."
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
            Entrar con email
          </h1>
          <p className="mt-3 text-gray-600">
            Usa un email para identificar tus anuncios en este entorno simple.
          </p>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Acceso temporal de pruebas. Más adelante se añadirá contraseña.
          </p>

          <form onSubmit={login} className="mt-8 space-y-4">
            <input
              className="w-full rounded border border-gray-300 p-3 outline-none transition focus:border-green-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
              required
            />

            <button
              className="w-full rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              type="submit"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </section>
      </main>
    </>
  );
}
