import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FormEvent, type MouseEvent } from "react";
import ListingCard, { type ListingCardItem } from "../../components/ListingCard";
import NavBar from "../../components/NavBar";
import ReportModal from "../../components/ReportModal";
import UserAvatar from "../../components/UserAvatar";
import { useAuth } from "../../lib/authContext";
import { prisma } from "../../lib/prisma";
import { getCanonical } from "../../lib/seo";
import { normalizeUsername } from "../../lib/userIdentity";

type PublicListing = ListingCardItem;

type PublicUserPageProps = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    createdAt: string;
    reviewAverage: number | null;
    reviewCount: number;
    reviews: {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      reviewer: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
      };
      conversationId?: string | null;
      listing: {
        id: string;
        title: string;
      } | null;
    }[];
    listings: PublicListing[];
  } | null;
};

type PublicReview = NonNullable<PublicUserPageProps["user"]>["reviews"][number];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getDisplayName = (
  displayName: string | null | undefined,
  username: string | null | undefined
) => displayName?.trim() || (username ? `@${username}` : "Usuario Faralaes");

const getSafeAverage = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const formatRelativeDate = (value: string) => {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  const units: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 3600, divisor: 60, unit: "minute" },
    { limit: 86400, divisor: 3600, unit: "hour" },
    { limit: 2592000, divisor: 86400, unit: "day" },
    { limit: 31536000, divisor: 2592000, unit: "month" },
    { limit: Infinity, divisor: 31536000, unit: "year" },
  ];
  const selected = units.find((unit) => seconds < unit.limit) || units[units.length - 1];

  return new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" }).format(
    -Math.floor(seconds / selected.divisor),
    selected.unit
  );
};

const Stars = ({
  value,
  size = "text-lg",
}: {
  value: number;
  size?: string;
}) => (
  <span
    className={`inline-flex items-center gap-0.5 ${size}`}
    aria-label={`${value} de 5 estrellas`}
  >
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

const TrustBadge = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 shadow-sm">
    <span className="h-2 w-2 rounded-full bg-green-700" aria-hidden="true" />
    <span>
      <span className="block text-[10px] font-black uppercase tracking-wide text-stone-400">
        {label}
      </span>
      <span className="block leading-tight">{value}</span>
    </span>
  </span>
);

export const getServerSideProps: GetServerSideProps<
  PublicUserPageProps
> = async ({ params }) => {
  const rawUsername = typeof params?.username === "string" ? params.username : "";
  const username = normalizeUsername(rawUsername);

  if (!username && !UUID_PATTERN.test(rawUsername)) {
    return { notFound: true };
  }

  const user = await prisma.user.findFirst({
    where: UUID_PATTERN.test(rawUsername) ? { id: rawUsername } : { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      disabled: true,
      profile: {
        select: {
          displayName: true,
          bio: true,
          location: true,
        },
      },
      listings: {
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          sellerId: true,
          title: true,
          description: true,
          priceCents: true,
          operationType: true,
          location: true,
          size: true,
          color: true,
          brand: true,
          condition: true,
          shippingAvailable: true,
          whatsappContactAllowed: true,
          images: {
            orderBy: { sortOrder: "asc" },
            select: { url: true },
          },
        },
      },
    },
  });

  if (!user || user.disabled) {
    return { notFound: true };
  }

  let reviewAverage: number | null = null;
  let reviewCount = 0;
  let reviews: PublicReview[] = [];

  try {
    const [reviewSummary, latestReviews] = await Promise.all([
      prisma.review.aggregate({
        where: { reviewedUserId: user.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { reviewedUserId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          reviewer: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          conversation: {
            select: {
              id: true,
              listing: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    reviewAverage = getSafeAverage(reviewSummary._avg.rating);
    reviewCount = reviewSummary._count._all;
    reviews = latestReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      reviewer: {
        username: review.reviewer.username || "usuario",
        avatarUrl: review.reviewer.avatarUrl,
        displayName: getDisplayName(
          review.reviewer.displayName,
          review.reviewer.username
        ),
      },
      conversationId: review.conversationId,
      listing: review.conversation?.listing
        ? {
            id: review.conversation.listing.id,
            title: review.conversation.listing.title || "Anuncio",
          }
        : null,
    }));
  } catch (error) {
    console.error("No se han podido cargar las reviews del perfil publico.", error);
  }

  const safeUsername = user.username || username || user.id;
  const safeDisplayName = getDisplayName(
    user.displayName || user.profile?.displayName,
    safeUsername
  );
  const sellerSummary = {
    username: safeUsername,
    displayName: safeDisplayName,
    avatarUrl: user.avatarUrl,
  };

  return {
    props: {
      user: {
        id: user.id,
        username: safeUsername,
        displayName: safeDisplayName,
        avatarUrl: user.avatarUrl,
        bio: user.profile?.bio || null,
        location: user.profile?.location || null,
        createdAt: user.createdAt.toISOString(),
        reviewAverage,
        reviewCount,
        reviews,
        listings: user.listings.map((listing) => ({
          ...listing,
          seller: sellerSummary,
          sellerRatingAverage: reviewAverage,
          sellerReviewCount: reviewCount,
        })),
      },
    },
  };
};

export default function PublicUserPage({ user }: PublicUserPageProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [contactError, setContactError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [contacting, setContacting] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState(user?.reviews || []);
  const [reviewAverage, setReviewAverage] = useState(
    getSafeAverage(user?.reviewAverage)
  );
  const [reviewCount, setReviewCount] = useState(user?.reviewCount ?? 0);

  if (!user) {
    return null;
  }

  const isOwnProfile = currentUser?.id === user.id;
  const hasReviews = reviewCount > 0 && reviewAverage !== null;
  const profilePath = `/usuario/${user.username}`;
  const profileUrl = getCanonical(profilePath);
  const seoLocation = user.location ? ` en ${user.location}` : "";
  const seoTitle = `${user.displayName}${seoLocation} | moda flamenca en Faralaes`;
  const seoDescription = `${user.displayName} vende moda flamenca en Faralaes${seoLocation}. Consulta reseñas, anuncios activos y perfil de confianza.`;
  const memberSince = formatRelativeDate(user.createdAt);
  const firstListing = user.listings[0];
  const sellerJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName,
    alternateName: `@${user.username}`,
    url: profileUrl,
    image: user.avatarUrl ? getCanonical(user.avatarUrl) : undefined,
    address: user.location
      ? {
          "@type": "PostalAddress",
          addressLocality: user.location,
          addressCountry: "ES",
        }
      : undefined,
    description: user.bio || seoDescription,
    aggregateRating: hasReviews
      ? {
          "@type": "AggregateRating",
          ratingValue: reviewAverage.toFixed(1),
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    makesOffer: user.listings.slice(0, 6).map((listing) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: listing.title,
        image: listing.images?.[0]?.url
          ? getCanonical(listing.images[0].url)
          : undefined,
        url: getCanonical(`/producto/${listing.id}`),
      },
      price: (listing.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
    })),
  };

  const reportUser = () => {
    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setShowReportModal(true);
  };

  const contactSeller = async (listingId = firstListing?.id) => {
    setContactError("");

    if (isOwnProfile) {
      router.push("/perfil");
      return;
    }

    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (!listingId) {
      setContactError("Este vendedor no tiene anuncios activos para iniciar una conversación.");
      return;
    }

    setContacting(true);
    const res = await fetch("/api/conversaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    if (!res.ok) {
      setContacting(false);
      setContactError("No se ha podido iniciar la conversación.");
      return;
    }

    const conversation = await res.json();
    router.push(`/mensajes?conversationId=${conversation.id}`);
  };

  const shareProfile = async () => {
    setShareMessage("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: seoTitle,
          text: seoDescription,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Enlace copiado.");
    } catch {
      setShareMessage("No se ha podido compartir el perfil.");
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewMessage("");
    setReviewError("");

    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setSubmittingReview(true);
    const res = await fetch("/api/reviews/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewedUserId: user.id,
        rating,
        comment,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setReviewError(data?.error || "No se ha podido publicar la valoración.");
      setSubmittingReview(false);
      return;
    }

    setComment("");
    setRating(5);
    setReviewMessage("Valoración publicada correctamente.");

    const reviewsRes = await fetch(`/api/reviews/user/${user.id}`);
    if (reviewsRes.ok) {
      const data = await reviewsRes.json();
      setReviews(data.reviews || []);
      setReviewAverage(getSafeAverage(data.average));
      setReviewCount(data.count ?? 0);
    }
    setSubmittingReview(false);
  };

  const openListing = (listingId: string) => {
    router.push(`/producto/${listingId}`);
  };

  const contactFromListing =
    isOwnProfile
      ? undefined
      : (listingId: string) => (event: MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          contactSeller(listingId);
        };

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription.slice(0, 160)} />
        <link rel="canonical" href={profileUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sellerJsonLd) }}
        />
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-4 py-8 sm:px-6 lg:py-12">
        <section className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_48px_rgba(34,24,20,0.08)]">
            <div className="relative h-32 bg-gradient-to-r from-stone-950 via-red-950 to-green-900 sm:h-40">
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/35 to-transparent" />
            </div>
            <div className="px-3 pb-6 sm:px-6 sm:pb-8">
              <div className="relative -mt-8 rounded-[1.35rem] border border-white/80 bg-white p-5 shadow-[0_18px_40px_rgba(34,24,20,0.14)] sm:-mt-10 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <UserAvatar
                      user={user}
                      size="xl"
                      className="ring-4 ring-[#f8f3ef]"
                      expandable
                      imageAlt={user.displayName}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">
                        Perfil de vendedor
                      </p>
                      <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
                        {user.displayName}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-stone-600">
                        <span>@{user.username}</span>
                        {user.location && <span>{user.location}</span>}
                        {memberSince && <span>Miembro {memberSince}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => contactSeller()}
                      disabled={contacting}
                      className="tap-feedback rounded-full bg-green-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-800 disabled:cursor-wait disabled:bg-stone-400"
                    >
                      {isOwnProfile ? "Editar perfil" : contacting ? "Abriendo..." : "Contactar"}
                    </button>
                    <button
                      type="button"
                      onClick={shareProfile}
                      className="tap-feedback rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-800 shadow-sm transition hover:border-green-700 hover:text-green-700"
                    >
                      Compartir perfil
                    </button>
                  </div>
                </div>

                <div className="mt-7 grid gap-6 border-t border-stone-100 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
                  <div>
                    {user.bio ? (
                      <p className="max-w-3xl text-[15px] leading-7 text-stone-700">
                        {user.bio}
                      </p>
                    ) : (
                      <p className="max-w-3xl text-[15px] leading-7 text-stone-500">
                        Perfil activo en Faralaes con anuncios de moda flamenca publicados.
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <TrustBadge
                        label="Anuncios activos"
                        value={`${user.listings.length} publicados`}
                      />
                      <TrustBadge label="Respuestas" value="Rápidas" />
                      <TrustBadge label="Verificación" value="Preparado" />
                      <TrustBadge label="Tipo" value="Diseñador / tienda" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[#f8f3ef] p-4">
                    {hasReviews ? (
                      <>
                        <div className="flex items-end gap-3">
                          <p className="text-4xl font-black text-amber-700">
                            {reviewAverage.toFixed(1)}
                          </p>
                          <Stars value={reviewAverage} size="pb-1 text-2xl" />
                        </div>
                        <p className="mt-1 text-sm font-bold text-stone-700">
                          {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"} en Faralaes
                        </p>
                      </>
                    ) : (
                      <>
                        <Stars value={0} size="text-2xl" />
                        <p className="mt-2 text-sm font-bold text-stone-700">
                          Todavía no tiene valoraciones
                        </p>
                      </>
                    )}
                    {(contactError || shareMessage) && (
                      <p
                        className={`mt-3 text-xs font-bold ${
                          contactError ? "text-red-700" : "text-green-700"
                        }`}
                      >
                        {contactError || shareMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Valoraciones
              </p>
              <h2 className="mt-2 font-serif text-3xl text-gray-950">
                Confianza en Faralaes
              </h2>
              {hasReviews ? (
                <div className="mt-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <p className="text-4xl font-black text-amber-700">
                      {reviewAverage.toFixed(1)}
                    </p>
                    <Stars value={reviewAverage} size="pb-1 text-2xl" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    Basado en {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-600">
                  Todavía no tiene valoraciones
                </p>
              )}

              {!isOwnProfile && (
                <form onSubmit={submitReview} className="mt-6 space-y-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Estrellas
                    <div className="mt-2 grid grid-cols-5 gap-1 rounded-2xl border border-gray-200 bg-[#f8f3ef] p-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`rounded-xl px-2 py-2 text-lg transition ${
                            value <= rating
                              ? "bg-white text-amber-500 shadow-sm"
                              : "text-stone-300 hover:bg-white/70 hover:text-amber-400"
                          }`}
                          aria-label={`${value} de 5 estrellas`}
                          aria-pressed={value === rating}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="block text-sm font-bold text-gray-700">
                    Comentario opcional
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="mt-2 min-h-24 w-full rounded border border-gray-300 p-3"
                      maxLength={600}
                      placeholder="Cuenta cómo fue tu experiencia"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-wait disabled:bg-gray-400"
                  >
                    {submittingReview ? "Publicando..." : "Publicar valoración"}
                  </button>
                  {reviewMessage && (
                    <p className="text-sm font-semibold text-green-700">{reviewMessage}</p>
                  )}
                  {reviewError && (
                    <p className="text-sm font-semibold text-red-700">{reviewError}</p>
                  )}
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl text-gray-950">
                Últimas reseñas
              </h2>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">
                  Todavía no tiene valoraciones
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-gray-100 bg-[#f8f3ef] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <UserAvatar
                            user={review.reviewer}
                            size="xs"
                            expandable
                            imageAlt={review.reviewer.displayName}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-950">
                              {review.reviewer.displayName}
                            </p>
                            <p className="truncate text-xs font-semibold text-gray-500">
                              @{review.reviewer.username}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-gray-400">
                              {formatRelativeDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Stars value={review.rating} size="shrink-0 text-sm" />
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm leading-6 text-gray-700">
                          {review.comment}
                        </p>
                      )}
                      {review.listing && (
                        <Link
                          href={`/producto/${review.listing.id}`}
                          className="mt-3 inline-flex text-xs font-bold text-green-800 hover:text-green-900"
                        >
                          {review.listing.title}
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Anuncios activos
              </p>
              <h2 className="mt-2 font-serif text-3xl text-gray-950">
                Mini tienda de {user.displayName}
              </h2>
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {user.listings.length} anuncios publicados
            </p>
          </div>

          {user.listings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-600 shadow-sm">
              Este usuario todavía no tiene anuncios publicados.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {user.listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isOwnListing={isOwnProfile}
                  onClick={() => openListing(listing.id)}
                  onDetailsClick={(event) => {
                    event.stopPropagation();
                    openListing(listing.id);
                  }}
                  onMessageClick={contactFromListing?.(listing.id)}
                  onSellerClick={(event) => {
                    event.stopPropagation();
                    router.push(`/usuario/${user.username}`);
                  }}
                />
              ))}
            </div>
          )}

          {!isOwnProfile && (
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={reportUser}
                className="rounded-full border border-red-700 bg-white px-5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
              >
                Reportar usuario
              </button>
            </div>
          )}
        </section>
      </main>
      {showReportModal && (
        <ReportModal
          targetId={user.id}
          targetType="user"
          title="Reportar usuario"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}
