import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import NavBar from "../../components/NavBar";
import ReportModal from "../../components/ReportModal";
import { formatPrice } from "../../lib/formatPrice";
import { useAuth } from "../../lib/authContext";
import { prisma } from "../../lib/prisma";
import { getInitial, normalizeUsername } from "../../lib/userIdentity";

type PublicListing = {
  id: string;
  title: string;
  priceCents: number;
  images: { url: string }[];
};

type PublicUserPageProps = {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    location: string | null;
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
      };
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
          title: true,
          priceCents: true,
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
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
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
        displayName: getDisplayName(
          review.reviewer.displayName,
          review.reviewer.username
        ),
      },
      listing: review.listing
        ? {
            id: review.listing.id,
            title: review.listing.title || "Anuncio",
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

  return {
    props: {
      user: {
        id: user.id,
        username: safeUsername,
        displayName: safeDisplayName,
        bio: user.profile?.bio || null,
        location: user.profile?.location || null,
        reviewAverage,
        reviewCount,
        reviews,
        listings: user.listings,
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
  const [reviews, setReviews] = useState(user?.reviews || []);
  const [reviewAverage, setReviewAverage] = useState(
    getSafeAverage(user?.reviewAverage)
  );
  const [reviewCount, setReviewCount] = useState(user?.reviewCount ?? 0);

  if (!user) {
    return null;
  }

  const initial = getInitial(user.displayName, user.username);
  const isOwnProfile = currentUser?.id === user.id;
  const hasReviews = reviewCount > 0 && reviewAverage !== null;
  const reportUser = () => {
    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setShowReportModal(true);
  };
  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewMessage("");
    setReviewError("");

    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

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
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-green-700 text-3xl font-bold text-white shadow-sm">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                  Perfil publico
                </p>
                <h1 className="mt-2 font-serif text-4xl text-gray-950">
                  {user.displayName}
                </h1>
                <p className="mt-1 text-lg font-semibold text-gray-500">
                  @{user.username}
                </p>
                {(user.location || user.bio) && (
                  <div className="mt-4 max-w-2xl space-y-1 text-gray-600">
                    {user.location && <p>{user.location}</p>}
                    {user.bio && <p>{user.bio}</p>}
                  </div>
                )}
                {hasReviews ? (
                  <p className="mt-4 text-sm font-bold text-amber-700">
                    ⭐ {reviewAverage.toFixed(1)} · {reviewCount}{" "}
                    {reviewCount === 1 ? "reseña" : "reseñas"}
                  </p>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-gray-500">
                    Aún no tiene valoraciones
                  </p>
                )}
              </div>
              </div>
              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={reportUser}
                  className="self-start rounded-full border border-red-700 bg-white px-5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 sm:self-center"
                >
                  Reportar usuario
                </button>
              )}
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
                  <p className="text-4xl font-black text-amber-700">
                    ⭐ {reviewAverage.toFixed(1)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    Basado en {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-600">
                  Aún no tiene valoraciones
                </p>
              )}

              {!isOwnProfile && (
                <form onSubmit={submitReview} className="mt-6 space-y-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Estrellas
                    <select
                      value={rating}
                      onChange={(event) => setRating(Number(event.target.value))}
                      className="mt-2 h-11 w-full rounded border border-gray-300 bg-white px-3"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {"⭐".repeat(value)} {value}
                        </option>
                      ))}
                    </select>
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
                    className="w-full rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
                  >
                    Publicar valoración
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
                  Aún no tiene valoraciones
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-gray-100 bg-[#f8f3ef] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-950">
                            {review.reviewer.displayName}
                          </p>
                          <p className="text-xs font-semibold text-gray-500">
                            @{review.reviewer.username}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-amber-700">
                          ⭐ {review.rating}
                        </p>
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

          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                Anuncios
              </p>
              <h2 className="mt-2 font-serif text-3xl text-gray-950">
                Publicados por {user.displayName}
              </h2>
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {user.listings.length} anuncios
            </p>
          </div>

          {user.listings.length === 0 ? (
            <p className="mt-6 text-gray-600">
              Este usuario todavia no tiene anuncios publicados.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {user.listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/producto/${listing.id}`}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-gray-200">
                    {listing.images[0]?.url ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-gray-950">
                      {listing.title}
                    </h3>
                    <p className="mt-3 text-2xl font-semibold text-red-700">
                      {formatPrice(listing.priceCents)}
                    </p>
                  </div>
                </Link>
              ))}
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
