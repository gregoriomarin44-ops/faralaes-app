import { useRouter } from "next/router";
import { useState } from "react";
import NavBar from "../components/NavBar";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se ha podido iniciar sesion.");
      }

      const next = typeof router.query.next === "string" ? router.query.next : "";
      router.push(next && next.startsWith("/") ? next : "/catalogo");
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
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </h1>
          <p className="mt-3 text-gray-600">
            Accede a tus anuncios, perfil y mensajes con tu email y contraseña.
          </p>

          <form onSubmit={login} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 rounded-lg border border-gray-200 bg-[#f8f3ef] p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`rounded-md px-3 py-2 transition ${
                  mode === "login"
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-gray-600 hover:text-green-800"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`rounded-md px-3 py-2 transition ${
                  mode === "register"
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-gray-600 hover:text-green-800"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            <input
              className="w-full rounded border border-gray-300 p-3 outline-none transition focus:border-green-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
              required
            />

            <input
              className="w-full rounded border border-gray-300 p-3 outline-none transition focus:border-green-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              type="password"
              minLength={8}
              required
            />

            <button
              className="w-full rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              type="submit"
              disabled={loading}
            >
              {loading
                ? mode === "login"
                  ? "Entrando..."
                  : "Creando cuenta..."
                : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </section>
      </main>
    </>
  );
}
