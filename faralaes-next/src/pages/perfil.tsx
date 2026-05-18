import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import NavBar from "../components/NavBar";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../lib/authContext";
import { uploadAvatarImage } from "../lib/localUploads";

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
    avatarUrl: string | null;
  };
};

const CameraIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M14.5 5.5 13 3H9L7.5 5.5H5a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-4.5Z" />
    <path d="M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
  </svg>
);

export default function Perfil() {
  const router = useRouter();
  const { user, loading: authLoading, refresh, clear } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarStatus, setAvatarStatus] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const visibleAvatarUrl = avatarPreviewUrl || avatarUrl;

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
        setAvatarUrl(data.user.avatarUrl);
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

  useEffect(
    () => () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    },
    [avatarPreviewUrl]
  );

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
        avatarUrl,
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

  const guardarAvatarUrl = async (nextAvatarUrl: string | null) => {
    const res = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        phone,
        location,
        bio,
        avatarUrl: nextAvatarUrl,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "No se ha podido actualizar la foto.");
    }

    await refresh();
  };

  const cambiarAvatar = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return previewUrl;
    });
    setUploadingAvatar(true);
    setAvatarStatus("Subiendo foto...");
    setAvatarError("");
    setError("");
    setMensaje("");

    try {
      const result = await uploadAvatarImage(file);
      await guardarAvatarUrl(result.url);
      setAvatarUrl(result.url);
      setAvatarPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return "";
      });
      setAvatarStatus("Foto actualizada correctamente.");
    } catch (err) {
      setAvatarError(
        err instanceof Error
          ? err.message
          : "No se ha podido preparar la imagen de perfil."
      );
      setAvatarStatus("");
      setAvatarPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return "";
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const eliminarAvatar = async () => {
    setUploadingAvatar(true);
    setAvatarStatus("Eliminando foto...");
    setAvatarError("");
    setError("");
    setMensaje("");

    try {
      await guardarAvatarUrl(null);
      setAvatarUrl(null);
      setAvatarPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return "";
      });
      setAvatarStatus("Foto eliminada correctamente.");
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "No se ha podido eliminar la foto."
      );
      setAvatarStatus("");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const eliminarCuenta = async () => {
    setError("");
    setMensaje("");

    if (deleteConfirmation !== "ELIMINAR") {
      setError("Escribe ELIMINAR para confirmar la eliminacion.");
      return;
    }

    setDeleting(true);

    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: deleteConfirmation }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error || "No se ha podido eliminar la cuenta.");
      setDeleting(false);
      return;
    }

    setShowDeleteModal(false);
    clear();
    setMensaje(data?.message || "Tu cuenta ha sido eliminada correctamente.");
    window.setTimeout(() => {
      router.replace("/?accountDeleted=1");
    }, 1200);
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
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative rounded-full outline-none transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75"
              aria-label="Cambiar foto de perfil"
            >
              <UserAvatar
                user={{ displayName, username, avatarUrl: visibleAvatarUrl }}
                size="lg"
                className="ring-4 ring-[#f8f3ef]"
              />
              <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-700 text-sm text-white shadow-sm">
                <CameraIcon />
              </span>
            </button>
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
              <div className="rounded-2xl border border-gray-200 bg-[#f8f3ef] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="group relative mx-auto rounded-full outline-none transition hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75 sm:mx-0"
                    aria-label="Subir foto de perfil o logo"
                  >
                    <UserAvatar
                      user={{ displayName, username, avatarUrl: visibleAvatarUrl }}
                      size="xl"
                      className="ring-4 ring-white"
                    />
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-stone-950/70 px-2 py-1 text-center text-[11px] font-bold text-white opacity-100 backdrop-blur transition group-hover:bg-green-700">
                      {uploadingAvatar ? "Subiendo..." : "Cambiar"}
                    </span>
                    <span className="absolute -right-1 top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-green-700 text-sm text-white shadow-sm">
                      <CameraIcon />
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-950">
                      Foto de perfil o logo
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      JPG, PNG o WEBP. Máximo 2MB.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="rounded-full bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-wait disabled:bg-gray-400"
                      >
                        {uploadingAvatar ? "Subiendo..." : "Subir foto"}
                      </button>
                      {avatarUrl && !avatarPreviewUrl && (
                        <button
                          type="button"
                          onClick={eliminarAvatar}
                          disabled={uploadingAvatar}
                          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-red-700 hover:text-red-700 disabled:cursor-wait disabled:text-gray-400"
                        >
                          Eliminar foto
                        </button>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingAvatar}
                        onChange={(event) => {
                          cambiarAvatar(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </div>
                    {avatarStatus && (
                      <p className="mt-2 text-xs font-semibold text-green-700">
                        {avatarStatus}
                      </p>
                    )}
                    {avatarError && (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        {avatarError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
            Elimina definitivamente los datos personales de tu cuenta. Se
            borrarán tu perfil, favoritos, reportes creados e imágenes; los
            mensajes necesarios para conservar conversaciones de terceros se
            anonimizarán.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmation("");
              setShowDeleteModal(true);
            }}
            className="mt-5 rounded-full border border-red-700 bg-white px-5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            Eliminar mi cuenta
          </button>
        </section>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <section className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
              Eliminacion definitiva
            </p>
            <h2 className="mt-3 font-serif text-3xl text-gray-950">
              Eliminar mi cuenta
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              Esta acción eliminará tu perfil, anuncios, favoritos, imágenes y
              datos asociados. No se puede deshacer.
            </p>
            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Escribe ELIMINAR para confirmar
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="mt-2 w-full rounded border border-gray-300 p-3 font-normal outline-none transition focus:border-red-700"
                autoComplete="off"
              />
            </label>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-green-700 hover:text-green-700 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarCuenta}
                disabled={deleting || deleteConfirmation !== "ELIMINAR"}
                className="rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {deleting ? "Eliminando..." : "Eliminar mi cuenta"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
