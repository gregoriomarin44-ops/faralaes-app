import type { GetServerSideProps } from "next";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import { formatPrice } from "../../lib/formatPrice";
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
    username: string;
    displayName: string;
    bio: string | null;
    location: string | null;
    listings: PublicListing[];
  } | null;
};

export const getServerSideProps: GetServerSideProps<
  PublicUserPageProps
> = async ({ params }) => {
  const username = normalizeUsername(params?.username);

  if (!username) {
    return { notFound: true };
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      displayName: true,
      profile: {
        select: {
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

  if (!user) {
    return { notFound: true };
  }

  return {
    props: {
      user: {
        username: user.username,
        displayName: user.displayName,
        bio: user.profile?.bio || null,
        location: user.profile?.location || null,
        listings: user.listings,
      },
    },
  };
};

export default function PublicUserPage({ user }: PublicUserPageProps) {
  if (!user) {
    return null;
  }

  const initial = getInitial(user.displayName, user.username);

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
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
              </div>
            </div>
          </div>

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
    </>
  );
}
