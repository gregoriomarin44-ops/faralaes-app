import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { formatPrice } from "../lib/formatPrice";
import { prisma } from "../lib/prisma";
import {
  categorySeo,
  getCanonical,
  getSeoLinksForCategory,
  getSeoPage,
  SeoPage,
} from "../lib/seo";

type SeoListing = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  location: string | null;
  size: string | null;
  color: string | null;
  images: { url: string }[];
};

type SeoPageProps = {
  listings: SeoListing[];
  noindex: boolean;
  page: SeoPage;
};

export const getServerSideProps: GetServerSideProps<SeoPageProps> = async ({
  params,
  query,
}) => {
  const page = getSeoPage(params?.seo);

  if (!page) {
    return { notFound: true };
  }

  const where = {
    category: page.filters.category,
    status: "published",
    seller: { disabled: false },
    ...(page.filters.location
      ? { location: { contains: page.filters.location, mode: "insensitive" as const } }
      : {}),
    ...(page.filters.color
      ? { color: { equals: page.filters.color, mode: "insensitive" as const } }
      : {}),
    ...(page.filters.size
      ? { size: { equals: page.filters.size, mode: "insensitive" as const } }
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
      color: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
  });
  const pageWithCount = getSeoPage(params?.seo, listings.length);

  if (!pageWithCount) {
    return { notFound: true };
  }

  return {
    props: {
      listings,
      noindex:
        listings.length === 0 || Object.keys(query).some((key) => key !== "seo"),
      page: pageWithCount,
    },
  };
};

export default function SeoLanding({
  listings,
  noindex,
  page,
}: SeoPageProps) {
  const category = categorySeo[page.categorySlug];
  const breadcrumbItems = [
    { href: "/", label: "Inicio" },
    { href: `/${page.categorySlug}`, label: category.plural },
    ...(page.filters.location
      ? [{ href: page.slug, label: page.filters.location }]
      : page.filters.color
        ? [{ href: page.slug, label: page.filters.color }]
        : page.filters.size
          ? [{ href: page.slug, label: `Talla ${page.filters.size}` }]
        : []),
  ];
  const relatedSeoLinks =
    page.kind === "category" ? getSeoLinksForCategory(page.categorySlug) : null;
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
  const itemListJsonLd =
    listings.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: listings.map((listing, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: getCanonical(`/producto/${listing.id}`),
            item: {
              "@type": "Product",
              name: listing.title,
              image: listing.images[0]?.url,
              offers: {
                "@type": "Offer",
                price: (listing.priceCents / 100).toFixed(2),
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
                url: getCanonical(`/producto/${listing.id}`),
              },
            },
          })),
        }
      : null;

  return (
    <>
      <Head>
        <title>{page.title}</title>
        <meta name="description" content={page.metaDescription} />
        {noindex && <meta name="robots" content="noindex,follow" />}
        <link rel="canonical" href={page.canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        {itemListJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
          />
        )}
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
              {page.h1}
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              {page.introText}
            </p>
          </div>

          {relatedSeoLinks && (
            <section className="mt-10 grid gap-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-3">
              {[
                { title: "Por ciudad", links: relatedSeoLinks.cities },
                { title: "Por color", links: relatedSeoLinks.colors },
                { title: "Por talla", links: relatedSeoLinks.sizes },
              ]
                .filter((group) => group.links.length > 0)
                .map((group) => (
                  <div key={group.title}>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500">
                      {group.title}
                    </h2>
                    <div className="mt-4 flex flex-col gap-3">
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-sm font-semibold text-stone-700 hover:text-green-800"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </section>
          )}

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
                      {listing.color ? ` · ${listing.color}` : ""}
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
