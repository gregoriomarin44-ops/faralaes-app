import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import ReportModal from "../../components/ReportModal";
import { formatPrice } from "../../lib/formatPrice";
import { AUTH_COOKIE_NAME, verifySessionToken } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { getCanonical, getSeoProductLinks } from "../../lib/seo";
import { getOperationLabel, isDonationListing } from "../../lib/listingOperation";
import { getInitial } from "../../lib/userIdentity";
import {
  getCategoryLabel,
  getConditionLabel,
  getDisplayAttributes,
  getUsageLabel,
} from "../../lib/listingOptions";

type Producto = {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  priceCents: number;
  operationType?: string | null;
  category: string;
  size: string | null;
  color: string | null;
  brand: string | null;
  usage: string | null;
  location: string | null;
  condition: string | null;
  attributes: Record<string, string | number | boolean> | null;
  shippingAvailable: boolean;
  whatsappContactAllowed: boolean;
  status: string;
  createdAt: string;
  images?: {
    url: string;
  }[];
  seller?: {
    id: string;
    username: string;
    displayName: string;
    profile?: {
      phone?: string | null;
      location?: string | null;
    } | null;
  } | null;
};

type RelatedListing = {
  id: string;
  title: string;
  priceCents: number;
  operationType?: string | null;
  location: string | null;
  images?: {
    url: string;
  }[];
};

type ProductoDetalleProps = {
  initialProducto: Producto | null;
  relatedListings: RelatedListing[];
};

const categoryLabels: Record<string, { label: string; path: string }> = {
  traje: { label: "Trajes de flamenca", path: "/trajes-flamenca" },
  zapatos: { label: "Zapatos de flamenca", path: "/zapatos-flamenca" },
  complementos: { label: "Complementos flamencos", path: "/complementos-flamencos" },
  abanicos: { label: "Abanicos flamencos", path: "/abanicos-flamencos" },
  mantoncillo: { label: "Mantoncillos flamencos", path: "/mantoncillos-flamencos" },
  nina: { label: "Moda flamenca de niña", path: "/moda-flamenca-nina" },
  hombre: { label: "Moda flamenca de hombre", path: "/moda-flamenca-hombre" },
  flores: { label: "Flores flamencas", path: "/flores-flamencas" },
  pendientes: { label: "Pendientes flamencos", path: "/pendientes-flamencos" },
  peinetas: { label: "Peinetas flamencas", path: "/peinetas-flamencas" },
  bolsos: { label: "Bolsos flamencos", path: "/bolsos-flamencos" },
  moda_rociera: { label: "Moda rociera", path: "/moda-rociera" },
  otros: { label: "Otros artículos flamencos", path: "/otros" },
};

export const getServerSideProps: GetServerSideProps<ProductoDetalleProps> = async ({
  params,
  req,
}) => {
  const id = params?.id;

  if (!id || typeof id !== "string") {
    return { notFound: true };
  }

  const session = req.cookies[AUTH_COOKIE_NAME]
    ? verifySessionToken(req.cookies[AUTH_COOKIE_NAME])
    : null;
  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, disabled: true },
      })
    : null;
  const isAdmin = currentUser?.role === "ADMIN" && !currentUser.disabled;

  const producto = await prisma.listing.findFirst({
    where: {
      id,
      ...(isAdmin ? {} : { status: "published" }),
      seller: { disabled: false },
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: {
            select: {
              phone: true,
              location: true,
            },
          },
        },
      },
    },
  });

  if (!producto) {
    return { notFound: true };
  }

  const relatedListings = await prisma.listing.findMany({
    where: {
      id: { not: producto.id },
      status: "published",
      seller: { disabled: false },
      OR: [
        { category: producto.category },
        ...(producto.location ? [{ location: producto.location }] : []),
      ],
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      priceCents: true,
      operationType: true,
      location: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
  });

  return {
    props: {
      initialProducto: JSON.parse(JSON.stringify(producto)),
      relatedListings,
    },
  };
};

export default function ProductoDetalle({
  initialProducto,
  relatedListings,
}: ProductoDetalleProps) {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState<Producto | null>(initialProducto);
  const [selectedImage, setSelectedImage] = useState(
    initialProducto?.images?.[0]?.url || ""
  );
  const [userId, setUserId] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(!initialProducto);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => setUserId(user?.id || ""))
      .catch(() => setUserId(""));

    if (initialProducto) {
      return;
    }

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
  }, [id, initialProducto, router.isReady]);

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
        <main className="min-h-screen bg-[#f8f3ef] px-4 py-8 sm:px-6 lg:py-12">
          <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:gap-10">
            <div className="skeleton aspect-[4/5] rounded-[1.75rem]" />
            <div className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="skeleton h-4 w-32 rounded-full" />
              <div className="skeleton mt-5 h-12 w-4/5 rounded-full" />
              <div className="skeleton mt-4 h-12 w-1/2 rounded-full" />
              <div className="mt-8 grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="skeleton h-16 rounded-2xl" />
                ))}
              </div>
            </div>
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
  const isDonation = isDonationListing(producto.operationType);
  const esPropio = userId === producto.sellerId;
  const sellerPhone = producto.seller?.profile?.phone?.replace(/\D/g, "") || "";
  const sellerUsername = producto.seller?.username || "";
  const sellerProfileSlug = sellerUsername || producto.seller?.id || "";
  const sellerDisplayName = producto.seller?.displayName || "Usuario Faralaes";
  const sellerInitial = getInitial(sellerDisplayName, sellerUsername);
  const puedeWhatsapp =
    userId &&
    !esPropio &&
    producto.whatsappContactAllowed &&
    producto.seller?.profile?.phone;
  const categoryInfo = categoryLabels[producto.category] || {
    label: producto.category,
    path: "/catalogo",
  };
  const productSeoLinks = getSeoProductLinks({
    category: producto.category,
    color: producto.color,
    location: producto.location,
    size: producto.size,
  });
  const categoryPath = productSeoLinks[0]?.href || categoryInfo.path;
  const locationLink = productSeoLinks.find((link) =>
    link.label.includes(" en ")
  );
  const sizeLink = productSeoLinks.find((link) => link.label.includes(" talla "));
  const colorLink = productSeoLinks.find(
    (link) =>
      link.href !== categoryPath &&
      !link.label.includes(" en ") &&
      !link.label.includes(" talla ")
  );
  const productUrl = getCanonical(`/producto/${producto.id}`);
  const metaDescription =
    producto.description?.slice(0, 150) ||
    `${producto.title}${producto.brand ? ` de ${producto.brand}` : ""} en Faralaes${isDonation ? " como regalo o donación" : ` por ${formatPrice(producto.priceCents)}`}${producto.location ? ` en ${producto.location}` : ""}.`;
  const breadcrumbItems = [
    { href: "/", label: "Inicio" },
    { href: categoryPath, label: categoryInfo.label },
    ...(producto.location && locationLink
      ? [{ href: locationLink.href, label: producto.location }]
      : []),
    { href: `/producto/${producto.id}`, label: producto.title },
  ];
  const attributeItems = getDisplayAttributes(producto.category, producto.attributes);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.title,
    description: metaDescription,
    image: images.map((image) => image.url),
    category: categoryInfo.label,
    brand: producto.brand ? { "@type": "Brand", name: producto.brand } : undefined,
    additionalProperty: [
      producto.size
        ? { "@type": "PropertyValue", name: "Talla", value: producto.size }
        : null,
      producto.color
        ? { "@type": "PropertyValue", name: "Color", value: producto.color }
        : null,
      producto.usage
        ? { "@type": "PropertyValue", name: "Tipo de uso", value: getUsageLabel(producto.usage) }
        : null,
      producto.condition
        ? { "@type": "PropertyValue", name: "Estado", value: getConditionLabel(producto.condition) }
        : null,
      ...attributeItems.map((item) => ({
        "@type": "PropertyValue",
        name: item.label,
        value: item.value,
      })),
    ].filter(Boolean),
    offers: {
      "@type": "Offer",
      price: (producto.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: productUrl,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: getCanonical(item.href),
    })),
  };
  const detailItems = [
    { label: "Talla", value: producto.size || "Única", icon: "T" },
    { label: "Color", value: producto.color || "Sin color", icon: "C" },
    {
      label: "Marca",
      value: producto.brand || "No indicado",
      icon: "M",
    },
    { label: "Uso", value: getUsageLabel(producto.usage), icon: "U" },
    {
      label: "Ubicación",
      value: producto.location || "Sin ubicación",
      icon: "L",
    },
    {
      label: "Estado",
      value: getConditionLabel(producto.condition),
      icon: "E",
    },
  ];
  const primaryCta = esPropio ? (
    <button
      type="button"
      onClick={() => router.push(`/editar/${producto.id}`)}
      className="tap-feedback w-full rounded-full bg-stone-950 px-6 py-4 text-center font-bold text-white shadow-sm hover:bg-red-950"
    >
      Editar anuncio
    </button>
  ) : !userId ? (
    <button
      type="button"
      onClick={() => router.push("/login")}
      className="tap-feedback w-full rounded-full bg-green-700 px-6 py-4 text-center font-bold text-white shadow-sm hover:bg-green-800"
    >
      Entra para contactar
    </button>
  ) : !producto.whatsappContactAllowed ? (
    <p className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-center font-semibold text-gray-700">
      Este vendedor no permite contacto por WhatsApp
    </p>
  ) : !producto.seller?.profile?.phone ? (
    <p className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-center font-semibold text-gray-700">
      Este vendedor no tiene teléfono de WhatsApp configurado
    </p>
  ) : puedeWhatsapp ? (
    <a
      href={`https://wa.me/${sellerPhone}?text=${whatsappText}`}
      target="_blank"
      rel="noopener noreferrer"
      className="tap-feedback block w-full rounded-full bg-green-700 px-6 py-4 text-center font-bold text-white shadow-[0_12px_28px_rgba(21,128,61,0.24)] hover:bg-green-800"
    >
      Contactar por WhatsApp
    </a>
  ) : null;
  const secondaryCta =
    userId && !esPropio ? (
      <button
        type="button"
        onClick={enviarMensaje}
        className="tap-feedback w-full rounded-full border border-stone-300 bg-white px-6 py-4 text-center font-bold text-stone-800 shadow-sm hover:border-green-700 hover:text-green-700"
      >
        Enviar mensaje
      </button>
    ) : null;

  return (
    <>
      <Head>
        <title>{producto.title} | Faralaes</title>
        <meta name="description" content={metaDescription} />
        {producto.status !== "published" && (
          <meta name="robots" content="noindex,nofollow" />
        )}
        <link rel="canonical" href={productUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-10">
        <section className="mx-auto max-w-6xl">
        <nav className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-gray-400 sm:text-sm">
          {breadcrumbItems.map((item, index) => (
            <span key={item.href} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300">/</span>}
              <Link href={item.href} className="transition hover:text-green-800">
                {item.label}
              </Link>
            </span>
          ))}
        </nav>
        <button
          type="button"
          onClick={volverAlCatalogo}
          className="tap-feedback mb-5 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-green-700 hover:text-green-700"
        >
          Volver al catálogo
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:gap-10">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="group flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-sm sm:aspect-[5/6] lg:shadow-[0_24px_70px_rgba(34,24,20,0.12)]">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={producto.title}
                  loading="eager"
                  className="motion-image h-full w-full object-cover transition duration-200 ease-out group-hover:scale-[1.015]"
                />
              ) : (
                <div className="skeleton h-full w-full" aria-label="Sin imagen" />
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image.url}-${index}`}
                    onClick={() => setSelectedImage(image.url)}
                    className={`tap-feedback aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm sm:h-auto sm:w-auto ${
                      selectedImage === image.url
                        ? "border-stone-950 ring-2 ring-stone-950/10"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={`${producto.title} ${index + 1}`}
                      loading="lazy"
                      className="motion-image h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="motion-card rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
            <div className="border-b border-gray-100 pb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-red-700">
                {getCategoryLabel(producto.category)}
              </p>

              <h1 className="mb-4 font-serif text-[2rem] font-semibold leading-[1.05] text-gray-950 sm:text-5xl">
                {producto.title}
              </h1>

              {isDonation ? (
                <div className="space-y-3">
                  <p className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-black uppercase tracking-wide text-green-800">
                    {getOperationLabel(producto.operationType)}
                  </p>
                  <p className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-green-900">
                    Este anuncio está publicado como regalo o donación. Acuerda
                    directamente con la persona anunciante la entrega.
                  </p>
                </div>
              ) : (
                <p className="text-5xl font-extrabold tracking-tight text-red-700 sm:text-6xl">
                  {formatPrice(producto.priceCents)}
                </p>
              )}
              <p className="mt-3 text-sm font-semibold text-gray-400">
                Publicado el {publishedDate}
              </p>
            </div>

            {producto.description && (
              <div className="border-b border-gray-100 py-6">
                <h2 className="mb-3 text-lg font-bold text-gray-950">
                  Descripción
                </h2>
                <p className="text-[15px] leading-7 text-gray-600">
                  {producto.description}
                </p>
              </div>
            )}

            <div className="border-b border-gray-100 py-6">
              <h2 className="mb-4 text-lg font-bold text-gray-950">
                Detalles
              </h2>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {detailItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_8px_22px_rgba(34,24,20,0.04)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f3ef] text-xs font-black text-red-800">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {item.label}
                      </span>
                      <span className="block truncate font-bold text-gray-950">
                        {item.value}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {attributeItems.length > 0 && (
              <div className="border-b border-gray-100 py-6">
                <h2 className="mb-4 text-lg font-bold text-gray-950">
                  Características
                </h2>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  {attributeItems.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-gray-200 bg-[#f8f3ef] p-3"
                    >
                      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {item.label}
                      </span>
                      <span className="mt-1 block font-bold text-gray-950">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {producto.seller && (
              <div className="border-b border-gray-100 py-6">
                <h2 className="mb-4 text-lg font-bold text-gray-950">
                  Vendedor
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (sellerProfileSlug) {
                      router.push(`/usuario/${sellerProfileSlug}`);
                    }
                  }}
                  className="tap-feedback flex w-full items-center gap-4 rounded-3xl border border-gray-200 bg-white p-4 text-left shadow-[0_12px_32px_rgba(34,24,20,0.06)] hover:border-green-700"
                >
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-950 to-red-900 text-xl font-black text-white shadow-md">
                    <span>{sellerInitial}</span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-600" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-gray-950">
                      {sellerDisplayName}
                    </span>
                    <span className="block text-sm font-semibold text-gray-500">
                      {sellerUsername ? `@${sellerUsername}` : "Perfil de Faralaes"}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-green-700">
                      Perfil verificado por Faralaes
                    </span>
                  </span>
                  <span className="text-xl text-gray-300" aria-hidden="true">
                    ›
                  </span>
                </button>
              </div>
            )}

            <div className="mt-6 hidden space-y-3 lg:block">
              {primaryCta}
              {secondaryCta}
            </div>

            {!esPropio && (
              <button
                type="button"
                onClick={reportarAnuncio}
                className="tap-feedback mt-3 w-full rounded-full border border-red-700 bg-white px-6 py-3 text-center text-sm font-bold text-red-700 shadow-sm hover:bg-red-50"
              >
                Reportar anuncio
              </button>
            )}

            <div className="mt-6 space-y-1 text-xs text-gray-400">
              <p>ID del producto: {producto.id}</p>
            </div>
          </div>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="motion-card rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl text-gray-950">
              Explora más en Faralaes
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={categoryPath}
                className="tap-feedback rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-green-700 hover:text-green-700"
              >
                Más {categoryInfo.label.toLowerCase()}
              </Link>
              {producto.location && locationLink && (
                <Link
                  href={locationLink.href}
                  className="tap-feedback rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-green-700 hover:text-green-700"
                >
                  Más anuncios en {producto.location}
                </Link>
              )}
              {producto.size && sizeLink && (
                <Link
                  href={sizeLink.href}
                  className="tap-feedback rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-green-700 hover:text-green-700"
                >
                  Más talla {producto.size}
                </Link>
              )}
              {producto.color && colorLink && (
                <Link
                  href={colorLink.href}
                  className="tap-feedback rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-green-700 hover:text-green-700"
                >
                  Más en {producto.color}
                </Link>
              )}
            </div>
          </div>

          <div className="motion-card rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl text-gray-950">
              Anuncios similares
            </h2>
            {relatedListings.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No hay anuncios similares activos ahora mismo.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {relatedListings.map((related) => (
                  <Link
                    key={related.id}
                    href={`/producto/${related.id}`}
                    className="tap-feedback rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-green-700"
                  >
                    <p className="font-semibold text-gray-950">{related.title}</p>
                    <p className="mt-1 text-sm font-bold text-red-700">
                      {isDonationListing(related.operationType)
                        ? getOperationLabel(related.operationType)
                        : formatPrice(related.priceCents)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {related.location || "Sin ubicacion"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-16px_36px_rgba(34,24,20,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <div className="flex-1">{primaryCta}</div>
          {secondaryCta && <div className="flex-1">{secondaryCta}</div>}
        </div>
      </div>
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
