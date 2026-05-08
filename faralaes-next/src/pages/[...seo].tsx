import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { formatPrice } from "../lib/formatPrice";
import { prisma } from "../lib/prisma";
import {
  buildSeoCopy,
  buildSeoPath,
  categorySeo,
  getCanonical,
  parseSeoRoute,
  SeoRoute,
} from "../lib/seo";

type SeoListing = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  location: string | null;
  size: string | null;
  images: { url: string }[];
};

type SeoPageProps = {
  canonical: string;
  copy: ReturnType<typeof buildSeoCopy>;
  listings: SeoListing[];
  noindex: boolean;
  route: SeoRoute;
};

export const getServerSideProps: GetServerSideProps<SeoPageProps> = async ({
  params,
}) => {
  const route = parseSeoRoute(params?.seo);

  if (!route) {
    return { notFound: true };
  }

  const category = categorySeo[route.categorySlug];
  const where = {
    category: category.category,
    status: "published",
    seller: { disabled: false },
    ...(route.location
      ? { location: { contains: route.location, mode: "insensitive" as const } }
      : {}),
    ...(route.size
      ? { size: { equals: route.size, mode: "insensitive" as const } }
      : {}),
  };

  const listings = await prisma.listing.findMany({
    where,
    take: 24,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      location: true,
      size: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
  });
  const copy = buildSeoCopy(route, listings.length);
  const path = buildSeoPath(route);

  return {
    props: {
      canonical: getCanonical(path),
      copy,
      listings,
      noindex: listings.length === 0,
      route,
    },
  };
};

export default function SeoLanding({
  canonical,
  copy,
  listings,
  noindex,
  route,
}: SeoPageProps) {
  const category = categorySeo[route.categorySlug];
  const breadcrumbItems = [
    { href: "/", label: "Inicio" },
    { href: `/${route.categorySlug}`, label: category.plural },
    ...(route.location
      ? [{ href: buildSeoPath(route), label: route.location }]
      : route.size
        ? [{ href: buildSeoPath(route), label: `Talla ${route.size}` }]
        : []),
  ];
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

  return (
    <>
      <Head>
        <title>{copy.title}</title>
        <meta name="description" content={copy.description} />
        {noindex && <meta name="robots" content="noindex,follow" />}
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <nav className="mb-6 flex flex-wrap gap-2 text-sm font-semibold text-stone-500">
            {breadcrumbItems.map((item, index) => (
              <span key={item.href} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                <Link href={item.href} className="hover:text-green-800">
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
              Faralaes
            </p>
            <h1 className="mt-3 font-serif text-4xl text-gray-950 md:text-5xl">
              {copy.h1}
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">{copy.intro}</p>
          </div>

          {listings.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8 text-stone-700 shadow-sm">
              Ahora mismo no hay anuncios activos para este filtro. Puedes ver el
              catálogo completo o volver más tarde.
              <div className="mt-5">
                <Link
                  href="/catalogo"
                  className="rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
                >
                  Ver catálogo
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((listing) => (
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
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-serif text-xl text-gray-950">
                      {listing.title}
                    </h2>
                    <p className="mt-3 text-2xl font-semibold text-red-700">
                      {formatPrice(listing.priceCents)}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {listing.location || "Sin ubicacion"}
                      {listing.size ? ` · Talla ${listing.size}` : ""}
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
