import type { GetServerSideProps } from "next";
import { prisma } from "../lib/prisma";
import {
  buildSeoPath,
  categorySeo,
  getSeoCategorySlugByCategory,
  getCanonical,
  normalizeSlugText,
  seoCities,
  seoColors,
  seoCategorySlugs,
  seoSizes,
} from "../lib/seo";

const staticPaths = [
  "/",
  "/catalogo",
  "/como-funciona",
  "/contacto",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/condiciones",
];

const renderUrl = (path: string, lastmod?: string) => `
  <url>
    <loc>${getCanonical(path)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
  </url>`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const listings = await prisma.listing.findMany({
    where: {
      status: "published",
      seller: { disabled: false },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const locationCounts = await prisma.listing.groupBy({
    by: ["category", "location"],
    where: {
      status: "published",
      seller: { disabled: false },
      location: { not: null },
    },
    _count: { _all: true },
    having: {
      location: { _count: { gte: 1 } },
    },
  });
  const sizeCounts = await prisma.listing.groupBy({
    by: ["category", "size"],
    where: {
      status: "published",
      seller: { disabled: false },
      size: { not: null },
    },
    _count: { _all: true },
  });
  const colorCounts = await prisma.listing.groupBy({
    by: ["category", "color"],
    where: {
      status: "published",
      seller: { disabled: false },
      color: { not: null },
    },
    _count: { _all: true },
  });

  const categoryPaths = seoCategorySlugs.map((categorySlug) =>
    buildSeoPath({ categorySlug })
  );

  const locationPaths = locationCounts
    .filter((count) => count.location)
    .map((count) => {
      const categorySlug = getSeoCategorySlugByCategory(count.category);
      const city = seoCities.find(
        (item) => item.slug === normalizeSlugText(count.location || "")
      );

      return categorySlug && city
        ? buildSeoPath({
            categorySlug,
            citySlug: city.slug,
          })
        : null;
    })
    .filter((path): path is string => Boolean(path));
  const sizePaths = sizeCounts
    .filter((count) => count.size && count._count._all > 0)
    .map((count) => {
      const categorySlug = getSeoCategorySlugByCategory(count.category);
      const size = normalizeSlugText(count.size || "");

      return categorySlug &&
        categorySeo[categorySlug].supportsSize &&
        seoSizes.includes(size as (typeof seoSizes)[number])
        ? buildSeoPath({
            categorySlug,
            size,
          })
        : null;
    })
    .filter((path): path is string => Boolean(path));
  const colorPaths = colorCounts
    .filter((count) => count.color && count._count._all > 0)
    .map((count) => {
      const categorySlug = getSeoCategorySlugByCategory(count.category);
      const color = seoColors.find(
        (item) => normalizeSlugText(item.label) === normalizeSlugText(count.color || "")
      );

      return categorySlug && color
        ? buildSeoPath({
            categorySlug,
            colorSlug: color.slug,
          })
        : null;
    })
    .filter((path): path is string => Boolean(path));

  const urls = [
    ...staticPaths.map((path) => renderUrl(path)),
    ...categoryPaths.map((path) => renderUrl(path)),
    ...Array.from(new Set(locationPaths)).map((path) => renderUrl(path)),
    ...Array.from(new Set(colorPaths)).map((path) => renderUrl(path)),
    ...Array.from(new Set(sizePaths)).map((path) => renderUrl(path)),
    ...listings.map((listing) =>
      renderUrl(`/producto/${listing.id}`, listing.updatedAt.toISOString())
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
