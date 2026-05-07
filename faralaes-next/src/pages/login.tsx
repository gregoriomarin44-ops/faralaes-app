import { useRouter } from "next/router";
import { useState } from "react";
import NavBar from "../components/NavBar";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

            <div className="relative">
              <input
                className="w-full rounded border border-gray-300 p-3 pr-12 outline-none transition focus:border-green-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:bg-[#f8f3ef] hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m3 3 18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M9.88 4.24A10.7 10.7 0 0 1 12 4c5 0 9 5 10 8a13.2 13.2 0 0 1-2.1 3.36" />
                    <path d="M6.61 6.61A13 13 0 0 0 2 12c1 3 5 8 10 8a10.8 10.8 0 0 0 5.39-1.61" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

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
