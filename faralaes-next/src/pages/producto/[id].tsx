import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import ReportModal from "../../components/ReportModal";
import { formatPrice } from "../../lib/formatPrice";
import { getInitial } from "../../lib/userIdentity";

type Producto = {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  condition: string | null;
  shippingAvailable: boolean;
  whatsappContactAllowed: boolean;
  status: string;
  createdAt: string;
  images?: {
    url: string;
  }[];
  seller?: {
    username: string;
    displayName: string;
    profile?: {
      phone?: string | null;
      location?: string | null;
    } | null;
  } | null;
};

export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [userId, setUserId] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => setUserId(user?.id || ""))
      .catch(() => setUserId(""));

    if (!id || typeof id !== "string") {
      setProducto(null);
      setError("Producto no encontrado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    fetch(`/api/productos/${id}`)
      .then((res) => {
        if (res.status === 404) {
          throw new Error("Producto no encontrado.");
        }

        if (!res.ok) {
          throw new Error("No se ha podido cargar el anuncio.");
        }

        return res.json();
      })
      .then((data: Producto) => {
        setProducto(data);
        setSelectedImage(data.images?.[0]?.url || "");
      })
      .catch((err: Error) => {
        setProducto(null);
        setError(err.message || "No se ha podido cargar el anuncio.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, router.isReady]);

  const volverAlCatalogo = () => {
    router.push("/catalogo");
  };

  const enviarMensaje = async () => {
    if (!producto || !userId) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/conversaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: producto.id,
      }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
      }

      return;
    }

    const conversacion = await res.json();
    router.push(`/mensajes?conversationId=${conversacion.id}`);
  };

  const reportarAnuncio = () => {
    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setShowReportModal(true);
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
          <section className="mx-auto max-w-6xl">
            <p className="text-center text-gray-600">Cargando anuncio...</p>
          </section>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
          <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="mb-6 text-gray-700">{error}</p>
            <button
              type="button"
              onClick={volverAlCatalogo}
              className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Volver al catálogo
            </button>
          </section>
        </main>
      </>
    );
  }

  if (!producto) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
          <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="mb-6 text-gray-700">Producto no encontrado.</p>
            <button
              type="button"
              onClick={volverAlCatalogo}
              className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Volver al catálogo
            </button>
          </section>
        </main>
      </>
    );
  }

  const whatsappText = encodeURIComponent(
    `Hola, me interesa el producto ${producto.title}`
  );
  const publishedDate = producto.createdAt
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(producto.createdAt))
    : "Fecha no disponible";
  const images = producto.images || [];
  const esPropio = userId === producto.sellerId;
  const sellerPhone = producto.seller?.profile?.phone?.replace(/\D/g, "") || "";
  const sellerUsername = producto.seller?.username || "";
  const sellerDisplayName = producto.seller?.displayName || "Usuario Faralaes";
  const sellerInitial = getInitial(sellerDisplayName, sellerUsername);
  const puedeWhatsapp =
    userId &&
    !esPropio &&
    producto.whatsappContactAllowed &&
    producto.seller?.profile?.phone;

  return (
    <>
      {producto.status !== "published" && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-4 py-8 sm:px-6 lg:py-12">
        <section className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={volverAlCatalogo}
          className="mb-6 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-green-700 hover:text-green-700"
        >
          Volver al catálogo
        </button>

        <div className="grid gap-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-10">
          <div>
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={producto.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400">Sin imagen</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-6">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image.url}-${index}`}
                    onClick={() => setSelectedImage(image.url)}
                    className={`aspect-square overflow-hidden rounded-xl border bg-gray-100 transition ${
                      selectedImage === image.url
                        ? "border-green-700 ring-2 ring-green-700/20"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={`${producto.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="border-b border-gray-100 pb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-red-700">
                {producto.category}
              </p>

              <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
                {producto.title}
              </h1>

              <p className="text-4xl font-bold text-red-700">
                {formatPrice(producto.priceCents)}
              </p>
            </div>

            {producto.description && (
              <div className="border-b border-gray-100 py-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-950">
                  Descripción
                </h2>
                <p className="leading-relaxed text-gray-600">
                  {producto.description}
                </p>
              </div>
            )}

            <div className="border-b border-gray-100 py-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-950">
                Detalles
              </h2>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Talla</p>
                  <p className="font-semibold text-gray-900">
                    {producto.size || "Única"}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Color</p>
                  <p className="font-semibold text-gray-900">
                    {producto.color || "Sin color"}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Ubicación</p>
                  <p className="font-semibold text-gray-900">
                    {producto.location || "Sin ubicación"}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Estado</p>
                  <p className="font-semibold text-gray-900">
                    {producto.condition || "No indicado"}
                  </p>
                </div>
              </div>
            </div>

            {producto.seller && (
              <div className="border-b border-gray-100 py-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-950">
                  Vendedor
                </h2>
                <button
                  type="button"
                  onClick={() => router.push(`/usuario/${sellerUsername}`)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-green-700 hover:bg-green-50"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 text-lg font-bold text-white">
                    {sellerInitial}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-950">
                      {sellerDisplayName}
                    </span>
                    <span className="block text-sm font-semibold text-gray-500">
                      @{sellerUsername}
                    </span>
                  </span>
                </button>
              </div>
            )}

            {esPropio ? (
              <button
                type="button"
                onClick={() => router.push(`/editar/${producto.id}`)}
                className="mt-6 w-full rounded-full bg-green-700 px-6 py-4 text-center font-bold text-white shadow-sm transition hover:bg-green-800"
              >
                Editar anuncio
              </button>
            ) : !userId ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-6 w-full rounded-full bg-green-700 px-6 py-4 text-center font-bold text-white shadow-sm transition hover:bg-green-800"
              >
                Entra para contactar
              </button>
            ) : !producto.whatsappContactAllowed ? (
              <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-center font-semibold text-gray-700">
                Este vendedor no permite contacto por WhatsApp
              </p>
            ) : !producto.seller?.profile?.phone ? (
              <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-center font-semibold text-gray-700">
                Este vendedor no tiene teléfono de WhatsApp configurado
              </p>
            ) : puedeWhatsapp ? (
              <a
                href={`https://wa.me/${sellerPhone}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full rounded-full bg-green-700 px-6 py-4 text-center font-bold text-white shadow-sm transition hover:bg-green-800"
              >
                Contactar por WhatsApp
              </a>
            ) : null}

            {userId && !esPropio && (
              <button
                type="button"
                onClick={enviarMensaje}
                className="mt-3 w-full rounded-full border border-green-700 bg-white px-6 py-4 text-center font-bold text-green-700 shadow-sm transition hover:bg-green-50"
              >
                Enviar mensaje
              </button>
            )}

            {!esPropio && (
              <button
                type="button"
                onClick={reportarAnuncio}
                className="mt-3 w-full rounded-full border border-red-700 bg-white px-6 py-3 text-center text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50"
              >
                Reportar anuncio
              </button>
            )}

            <div className="mt-6 space-y-1 text-xs text-gray-400">
              <p>Publicado el {publishedDate}</p>
              <p>ID del producto: {producto.id}</p>
            </div>
          </div>
        </div>
        </section>
      </main>
      {showReportModal && (
        <ReportModal
          targetId={producto.id}
          targetType="listing"
          title="Reportar anuncio"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}
