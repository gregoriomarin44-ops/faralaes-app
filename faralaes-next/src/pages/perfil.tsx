import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";

type Profile = {
  displayName: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
};

export default function Perfil() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail") || "";

    if (!userId) {
      router.push("/login");
      return;
    }

    fetch(`/api/perfil?userId=${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se ha podido cargar tu perfil.");
        }

        return res.json();
      })
      .then((profile: Profile | null) => {
        setDisplayName(profile?.displayName || userEmail.split("@")[0] || "");
        setPhone(profile?.phone || "");
        setLocation(profile?.location || "");
        setBio(profile?.bio || "");
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message || "No se ha podido cargar tu perfil.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    if (!displayName.trim()) {
      setError("El nombre público es obligatorio.");
      return;
    }

    setSaving(true);
    setMensaje("");
    setError("");

    const res = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        displayName,
        phone,
        location,
        bio,
      }),
    });

    if (res.ok) {
      setMensaje("Perfil guardado correctamente.");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se ha podido guardar tu perfil.");
    }

    setSaving(false);
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Perfil
          </p>
          <h1 className="mb-6 mt-3 font-serif text-4xl">
            Tus datos de contacto
          </h1>

          {loading && <p>Cargando perfil...</p>}

          {!loading && (
            <form onSubmit={guardar} className="space-y-4">
              <input
                className="w-full rounded border p-3"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nombre público"
                required
              />
              <input
                className="w-full rounded border p-3"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono / WhatsApp"
                type="tel"
              />
              <input
                className="w-full rounded border p-3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ubicación"
              />
              <textarea
                className="w-full rounded border p-3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                rows={4}
              />

              <button
                className="w-full rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                type="submit"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar perfil"}
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          {mensaje && <p className="mt-4 text-sm text-green-700">{mensaje}</p>}
        </section>
      </main>
    </>
  );
}
