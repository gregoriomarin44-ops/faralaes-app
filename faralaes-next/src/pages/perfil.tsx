import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { useAuth } from "../lib/authContext";
import { getInitial } from "../lib/userIdentity";

type Profile = {
  displayName: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
};

type ProfileResponse = {
  profile: Profile | null;
  user: {
    email: string;
    username: string;
    displayName: string;
  };
};

export default function Perfil() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setLoading(true);

    fetch("/api/perfil")
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
          return null;
        }

        if (!res.ok) {
          throw new Error("No se ha podido cargar tu perfil.");
        }

        return res.json();
      })
      .then((data: ProfileResponse | null) => {
        if (!data) {
          return;
        }

        const profile = data.profile;
        setDisplayName(data.user.displayName || profile?.displayName || "");
        setUsername(data.user.username);
        setPhone(profile?.phone || "");
        setLocation(profile?.location || "");
        setBio(profile?.bio || "");
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message || "No se ha podido cargar tu perfil.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, router, router.asPath, router.isReady, user]);

  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        displayName,
        phone,
        location,
        bio,
      }),
    });

    if (res.ok) {
      setMensaje("Perfil guardado correctamente.");
      await refresh();
      window.setTimeout(() => {
        router.replace("/catalogo");
      }, 700);
    } else if (res.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
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
          <div className="mb-6 mt-3 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-700 text-2xl font-bold text-white">
              {getInitial(displayName, username)}
            </div>
            <div>
              <h1 className="font-serif text-4xl">Tus datos</h1>
              {username && (
                <p className="mt-1 text-sm font-semibold text-gray-500">
                  @{username}
                </p>
              )}
            </div>
          </div>

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

        <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Cuenta
          </p>
          <h2 className="mt-3 font-serif text-3xl text-gray-950">
            Eliminación de cuenta
          </h2>
          <p className="mt-4 leading-7 text-gray-600">
            Puedes solicitar la eliminación de tu cuenta. Se eliminarán tu
            perfil, anuncios e imágenes asociadas cuando el flujo esté
            confirmado por soporte.
          </p>
          <button
            type="button"
            onClick={() => setDeleteRequested(true)}
            className="mt-5 rounded-full border border-red-700 bg-white px-5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            Solicitar eliminación de cuenta
          </button>
          {deleteRequested && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              Solicitud preparada. El siguiente paso será confirmar tu identidad
              y procesar la eliminación de forma segura.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
