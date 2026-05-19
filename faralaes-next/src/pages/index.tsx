import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { type MouseEvent } from "react";
import AccountBadges from "../components/AccountBadges";
import ListingCard, { type ListingCardItem } from "../components/ListingCard";
import NavBar from "../components/NavBar";
import UserAvatar from "../components/UserAvatar";
import { prisma } from "../lib/prisma";

type SellerCard = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  accountType: string;
  verified: boolean;
  location: string | null;
  listingCount: number;
  reviewAverage: number | null;
  reviewCount: number;
};

type ReviewSnippet = {
  id: string;
  rating: number;
  comment: string | null;
  reviewer: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

type CategoryCard = {
  value: string;
  label: string;
  imageUrl: string | null;
  tagline: string;
};

type HomeProps = {
  latestListings: ListingCardItem[];
  featuredSellers: SellerCard[];
  reviewSnippets: ReviewSnippet[];
  categoryCards: CategoryCard[];
  stats: {
    listings: number;
    users: number;
    reviews: number;
  };
};

const categoryConfig = [
  { value: "traje", label: "Trajes", tagline: "Volantes, lunares y feria" },
  { value: "mantoncillo", label: "Mantoncillos", tagline: "Color para rematar el look" },
  { value: "pendientes", label: "Pendientes", tagline: "Detalles con carácter" },
  { value: "nina", label: "Niña", tagline: "Moda flamenca infantil" },
  { value: "hombre", label: "Hombre", tagline: "Traje corto y romería" },
  { value: "bolsos", label: "Bolsos", tagline: "Complementos listos para salir" },
];

const getDisplayName = (
  displayName: string | null | undefined,
  username: string | null | undefined
) => displayName?.trim() || (username ? `@${username}` : "Usuario Faralaes");

const formatStat = (value: number) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);

const getSafeAverage = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const Stars = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= Math.round(value) ? "text-amber-500" : "text-stone-300"}
        aria-hidden="true"
      >
        ★
      </span>
    ))}
  </span>
);

const HomeSkeletonCard = () => (
  <div className="h-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
    <div className="skeleton aspect-[4/5]" />
    <div className="space-y-3 p-4">
      <div className="skeleton h-5 w-24 rounded-full" />
      <div className="skeleton h-4 w-full rounded-full" />
      <div className="skeleton h-4 w-2/3 rounded-full" />
    </div>
  </div>
);

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const [latestListings, listings, users, reviews, sellerGroups, latestReviews] =
    await Promise.all([
      prisma.listing.findMany({
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
          seller: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              accountType: true,
              verified: true,
            },
          },
        },
      }),
      prisma.listing.count({ where: { status: "published" } }),
      prisma.user.count({ where: { disabled: false } }),
      prisma.review.count(),
      prisma.listing.groupBy({
        by: ["sellerId"],
        where: { status: "published" },
        _count: { sellerId: true },
        orderBy: { _count: { sellerId: "desc" } },
        take: 4,
      }),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          reviewer: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

  const sellerIds = sellerGroups.map((group) => group.sellerId);
  const [sellers, sellerReviews, categoryImages] = await Promise.all([
    sellerIds.length
      ? prisma.user.findMany({
          where: { id: { in: sellerIds }, disabled: false },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            accountType: true,
            verified: true,
            profile: { select: { location: true } },
          },
        })
      : [],
    sellerIds.length
      ? prisma.review.groupBy({
          by: ["reviewedUserId"],
          where: { reviewedUserId: { in: sellerIds } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [],
    Promise.all(
      categoryConfig.map(async (category) => {
        const listing = await prisma.listing.findFirst({
          where: {
            category: category.value,
            status: "published",
            images: { some: {} },
          },
          orderBy: { createdAt: "desc" },
          select: {
            images: {
              orderBy: { sortOrder: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        });

        return [category.value, listing?.images[0]?.url || null] as const;
      })
    ),
  ]);

  const reviewBySeller = new Map(
    sellerReviews.map((review) => [
      review.reviewedUserId,
      {
        average: getSafeAverage(review._avg.rating),
        count: review._count._all,
      },
    ])
  );
  const listingCountBySeller = new Map(
    sellerGroups.map((group) => [group.sellerId, group._count.sellerId])
  );
  const sellerById = new Map(sellers.map((seller) => [seller.id, seller]));
  const categoryImageByValue = new Map(categoryImages);

  return {
    props: {
      stats: {
        listings,
        users,
        reviews,
      },
      latestListings: latestListings.map((listing) => ({
        ...JSON.parse(JSON.stringify(listing)),
        seller: listing.seller
          ? {
              username: listing.seller.username,
              displayName: listing.seller.displayName,
              avatarUrl: listing.seller.avatarUrl,
              accountType: listing.seller.accountType,
              verified: listing.seller.verified,
            }
          : null,
      })),
      featuredSellers: sellerIds
        .map((sellerId) => {
          const seller = sellerById.get(sellerId);

          if (!seller) {
            return null;
          }

          const review = reviewBySeller.get(sellerId);

          return {
            id: seller.id,
            username: seller.username,
            displayName: getDisplayName(seller.displayName, seller.username),
            avatarUrl: seller.avatarUrl,
            accountType: seller.accountType,
            verified: seller.verified,
            location: seller.profile?.location || null,
            listingCount: listingCountBySeller.get(sellerId) || 0,
            reviewAverage: review?.average || null,
            reviewCount: review?.count || 0,
          };
        })
        .filter((seller): seller is SellerCard => Boolean(seller)),
      reviewSnippets: latestReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer: {
          username: review.reviewer.username || "usuario",
          displayName: getDisplayName(
            review.reviewer.displayName,
            review.reviewer.username
          ),
          avatarUrl: review.reviewer.avatarUrl,
        },
      })),
      categoryCards: categoryConfig.map((category) => ({
        ...category,
        imageUrl: categoryImageByValue.get(category.value) || null,
      })),
    },
  };
};

export default function Home({
  latestListings,
  featuredSellers,
  reviewSnippets,
  categoryCards,
  stats,
}: HomeProps) {
  const router = useRouter();
  const heroImages = latestListings
    .flatMap((listing) => listing.images?.map((image) => image.url) || [])
    .slice(0, 3);

  const enviarMensaje = async (
    event: MouseEvent<HTMLButtonElement>,
    producto: ListingCardItem
  ) => {
    event.stopPropagation();

    const res = await fetch("/api/conversaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: producto.id }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/producto/${producto.id}`)}`);
      }

      return;
    }

    const conversacion = await res.json();
    router.push(`/mensajes?conversationId=${conversacion.id}`);
  };

  return (
    <>
      <Head>
        <title>Faralaes | Marketplace de moda flamenca de segunda mano</title>
        <meta
          name="description"
          content="Compra, vende, dona o regala moda flamenca de segunda mano en Faralaes: trajes de flamenca, mantoncillos, pendientes y complementos flamencos en Andalucía."
        />
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef]">
        <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:items-center lg:pb-16 lg:pt-12">
          <div>
            {router.query.accountDeleted === "1" && (
              <p className="mb-6 max-w-xl rounded-lg border border-green-100 bg-white px-4 py-3 text-sm font-semibold text-green-800 shadow-sm">
                Tu cuenta ha sido eliminada correctamente.
              </p>
            )}
            <p className="text-sm font-black uppercase tracking-[0.24em] text-red-700">
              Faralaes
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.75rem] font-semibold leading-[1.02] text-stone-950 sm:text-6xl">
              Compra, vende o da nueva vida a tu moda flamenca
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
              El marketplace especializado en trajes de flamenca, moda flamenca
              de segunda mano y complementos flamencos para feria, romería y
              celebraciones en Andalucía.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-red-900">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Nuevos anuncios cada día
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Compradoras y vendedoras de toda Andalucía
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/publicar")}
                className="tap-feedback rounded-full bg-green-700 px-7 py-3.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(21,128,61,0.24)] transition hover:bg-green-800"
              >
                Publicar gratis
              </button>
              <button
                type="button"
                onClick={() => router.push("/catalogo")}
                className="tap-feedback rounded-full border border-stone-300 bg-white px-7 py-3.5 text-sm font-black text-stone-800 shadow-sm transition hover:border-green-700 hover:text-green-700"
              >
                Ver catálogo
              </button>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { label: "Anuncios", value: stats.listings },
                { label: "Usuarios", value: stats.users },
                { label: "Valoraciones", value: stats.reviews },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4"
                >
                  <p className="text-2xl font-black text-stone-950 sm:text-3xl">
                    {formatStat(stat.value)}
                  </p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-stone-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_24px_70px_rgba(34,24,20,0.16)]">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-red-950 to-green-900" />
            <div className="relative grid h-full grid-cols-[0.92fr_1.08fr] gap-3">
              <div className="space-y-3 pt-10">
                <div className="rounded-2xl bg-white/95 p-3 shadow-lg">
                  <p className="text-xs font-black uppercase tracking-wide text-red-800">
                    Marketplace activo
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-800">
                    Moda flamenca con fotos, reseñas y mensajes privados.
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-100 bg-[#f8f3ef] p-3">
                  <div className="flex -space-x-2">
                    {featuredSellers.slice(0, 4).map((seller) => (
                      <UserAvatar
                        key={seller.id}
                        user={seller}
                        size="xs"
                        className="ring-2 ring-white"
                        expandable
                        imageAlt={seller.displayName}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-bold text-stone-600">
                    Comunidad de perfiles reales y valoraciones.
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`overflow-hidden rounded-2xl bg-stone-200 shadow-sm ${
                      index === 1 ? "ml-5" : index === 2 ? "mr-6" : ""
                    }`}
                  >
                    {heroImages[index] ? (
                      <img
                        src={heroImages[index]}
                        alt=""
                        className="h-full min-h-28 w-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="flex h-full min-h-28 items-center justify-center bg-gradient-to-br from-red-950 via-stone-900 to-green-900 text-3xl font-serif text-white">
                        F
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Explora por categoría
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-950">
                Encuentra tu próximo look flamenco
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryCards.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() =>
                  router.push({
                    pathname: "/catalogo",
                    query: { categoria: category.value },
                  })
                }
                className="group relative min-h-44 overflow-hidden rounded-2xl bg-stone-900 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-stone-900 to-green-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />
                <div className="relative flex h-full min-h-44 flex-col justify-end p-5 text-white">
                  <h3 className="font-serif text-3xl">{category.label}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/80">
                    {category.tagline}
                  </p>
                  <span className="mt-4 inline-flex w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-red-900">
                    Ver categoría
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Actividad reciente
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-950">
                Últimos anuncios publicados
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-stone-600">
                Moda flamenca de segunda mano para feria, romerías y eventos:
                trajes de flamenca, mantoncillos, pendientes y bolsos con nueva vida.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/catalogo")}
              className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-black text-stone-700 transition hover:border-green-700 hover:text-green-700"
            >
              Ver todos
            </button>
          </div>

          {latestListings.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="mx-auto max-w-xl text-gray-700">
                Todavía no hay anuncios publicados. Sé la primera persona en
                publicar un traje.
              </p>
              <button
                type="button"
                onClick={() => router.push("/publicar")}
                className="mt-5 rounded-full bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
              >
                Publicar gratis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestListings.slice(0, 8).map((producto, index) => (
                <div key={producto.id} className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-800 shadow-sm">
                      {index < 2 ? "Nuevo" : producto.location ? "Cerca de ti" : "Activo"}
                    </span>
                    {producto.sellerReviewCount ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-green-800 shadow-sm">
                        Con reseñas
                      </span>
                    ) : null}
                  </div>
                  <ListingCard
                    listing={producto}
                    onClick={() => router.push(`/producto/${producto.id}`)}
                    onMessageClick={(event) => enviarMensaje(event, producto)}
                    onSellerClick={(event) => {
                      event.stopPropagation();
                      const sellerSlug = producto.seller?.username || producto.sellerId;
                      if (sellerSlug) {
                        router.push(`/usuario/${sellerSlug}`);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {latestListings.length === 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <HomeSkeletonCard key={index} />
              ))}
            </div>
          )}
        </section>

        {featuredSellers.length > 0 && (
          <section className="border-y border-stone-200 bg-white px-4 py-14 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Vendedores destacados
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-950">
                Perfiles con movimiento en Faralaes
              </h2>
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredSellers.map((seller) => (
                  <article
                    key={seller.id}
                    className="rounded-2xl border border-stone-200 bg-[#f8f3ef] p-5 shadow-sm"
                  >
                    <UserAvatar
                      user={seller}
                      size="md"
                      expandable
                      imageAlt={seller.displayName}
                    />
                    <h3 className="mt-4 truncate font-serif text-2xl text-stone-950">
                      {seller.displayName}
                    </h3>
                    <p className="mt-1 truncate text-sm font-bold text-stone-500">
                      {seller.location || "Andalucía"}
                    </p>
                    <div className="mt-3">
                      <AccountBadges user={seller} compact />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm font-bold text-stone-700">
                      {seller.reviewAverage ? (
                        <>
                          <Stars value={seller.reviewAverage} />
                          <span>{seller.reviewAverage.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-stone-500">Sin reseñas aún</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-black uppercase tracking-wide text-red-800">
                      {seller.listingCount} anuncios
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push(`/usuario/${seller.username}`)}
                      className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm transition hover:text-green-700"
                    >
                      Ver perfil
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: "P",
                title: "Publica",
                text: "Sube fotos, talla, estado y precio en minutos.",
              },
              {
                number: "02",
                icon: "M",
                title: "Habla por mensajes",
                text: "Resuelve dudas antes de cerrar la compra o venta.",
              },
              {
                number: "03",
                icon: "V",
                title: "Compra o vende",
                text: "Dale salida a piezas que merecen otra feria.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-900 font-serif text-xl text-white">
                    {step.icon}
                  </span>
                  <span className="font-serif text-4xl text-stone-200">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-black text-stone-950">
                  {step.title}
                </h3>
                <p className="mt-2 leading-6 text-stone-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Confianza
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-950">
                Compra y vende con confianza
              </h2>
              <p className="mt-4 leading-7 text-stone-600">
                Mensajes privados, perfiles con valoraciones y una comunidad
                centrada en moda flamenca, trajes de flamenca y complementos
                flamencos reales.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(reviewSnippets.length ? reviewSnippets : [
                {
                  id: "placeholder-1",
                  rating: 5,
                  comment: "Comunicación clara y trato cercano.",
                  reviewer: {
                    username: "faralaes",
                    displayName: "Comunidad Faralaes",
                    avatarUrl: null,
                  },
                },
              ]).map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-stone-200 bg-[#f8f3ef] p-4"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar user={review.reviewer} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-stone-900">
                        {review.reviewer.displayName}
                      </p>
                      <Stars value={review.rating} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {review.comment || "Una experiencia cuidada dentro de Faralaes."}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-stone-950 via-red-950 to-green-900 px-6 py-12 text-center text-white shadow-[0_24px_70px_rgba(34,24,20,0.18)]">
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative">
              <h2 className="font-serif text-4xl sm:text-5xl">
                Hay trajes que merecen otra feria.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/85">
                Convierte ese traje guardado, unos pendientes o un mantoncillo
                en el próximo hallazgo de otra persona.
              </p>
              <button
                type="button"
                onClick={() => router.push("/publicar")}
                className="mt-7 rounded-full bg-green-700 px-7 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-green-800"
              >
                Publicar gratis
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
