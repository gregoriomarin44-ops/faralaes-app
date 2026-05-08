import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useMemo, useState } from "react";
import NavBar from "../components/NavBar";

export default function ResetPassword() {
  const router = useRouter();
  const token = useMemo(() => {
    const value = router.query.token;

    return typeof value === "string" ? value : "";
  }, [router.query.token]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se ha podido actualizar la contraseña.");
      }

      setMessage(data?.message || "Tu contraseña se ha actualizado. Ya puedes entrar.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se ha podido actualizar la contraseña."
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
            Nueva contraseña
          </h1>
          <p className="mt-3 text-gray-600">
            Crea una contraseña nueva para volver a entrar en tu cuenta.
          </p>

          {!token ? (
            <p className="mt-6 text-sm text-red-700">
              El enlace no es valido. Pide un nuevo email de recuperacion.
            </p>
          ) : (
            <form onSubmit={resetPassword} className="mt-8 space-y-4">
              <input
                className="w-full rounded border border-gray-300 p-3 outline-none transition focus:border-green-700"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nueva contraseña"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
              <input
                className="w-full rounded border border-gray-300 p-3 outline-none transition focus:border-green-700"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirmar contraseña"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />

              <button
                className="w-full rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                type="submit"
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          )}

          {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <Link
            href="/login"
            className="mt-6 inline-flex w-full justify-center rounded border border-green-700 bg-white p-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            Entrar
          </Link>
        </section>
      </main>
    </>
  );
}
