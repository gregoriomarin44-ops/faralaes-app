export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://faralaes.com";

export const categorySeo = {
  "trajes-flamenca": {
    category: "traje",
    plural: "trajes de flamenca",
    singular: "traje de flamenca",
    title: "Trajes de flamenca de segunda mano",
  },
  "zapatos-flamenca": {
    category: "zapatos",
    plural: "zapatos de flamenca",
    singular: "zapato de flamenca",
    title: "Zapatos de flamenca de segunda mano",
  },
  "complementos-flamencos": {
    category: "complementos",
    plural: "complementos flamencos",
    singular: "complemento flamenco",
    title: "Complementos flamencos de segunda mano",
  },
  "mantoncillos-flamencos": {
    category: "mantoncillo",
    plural: "mantoncillos flamencos",
    singular: "mantoncillo flamenco",
    title: "Mantoncillos flamencos de segunda mano",
  },
  "moda-flamenca-nina": {
    category: "nina",
    plural: "prendas flamencas de niña",
    singular: "prenda flamenca de niña",
    title: "Moda flamenca de niña de segunda mano",
  },
  "moda-flamenca-hombre": {
    category: "hombre",
    plural: "prendas flamencas de hombre",
    singular: "prenda flamenca de hombre",
    title: "Moda flamenca de hombre de segunda mano",
  },
  "flores-flamencas": {
    category: "flores",
    plural: "flores flamencas",
    singular: "flor flamenca",
    title: "Flores flamencas de segunda mano",
  },
  "pendientes-flamencos": {
    category: "pendientes",
    plural: "pendientes flamencos",
    singular: "pendiente flamenco",
    title: "Pendientes flamencos de segunda mano",
  },
  "peinetas-flamencas": {
    category: "peinetas",
    plural: "peinetas flamencas",
    singular: "peineta flamenca",
    title: "Peinetas flamencas de segunda mano",
  },
  "bolsos-flamencos": {
    category: "bolsos",
    plural: "bolsos flamencos",
    singular: "bolso flamenco",
    title: "Bolsos flamencos de segunda mano",
  },
  "moda-rociera": {
    category: "moda_rociera",
    plural: "moda rociera",
    singular: "prenda rociera",
    title: "Moda rociera de segunda mano",
  },
} as const;

export type SeoCategorySlug = keyof typeof categorySeo;

export type SeoRoute = {
  categorySlug: SeoCategorySlug;
  location?: string;
  size?: string;
};

export const seoCategorySlugs = Object.keys(categorySeo) as SeoCategorySlug[];

export const getSeoCategorySlugByCategory = (category: string) =>
  seoCategorySlugs.find((slug) => categorySeo[slug].category === category) ||
  null;

const capitalize = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const normalizeSlugText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const parseSeoRoute = (slug: string[] | string | undefined): SeoRoute | null => {
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const [categorySlug, modifier] = parts;

  if (!categorySlug || !seoCategorySlugs.includes(categorySlug as SeoCategorySlug)) {
    return null;
  }

  if (!modifier) {
    return { categorySlug: categorySlug as SeoCategorySlug };
  }

  if (parts.length > 2) {
    return null;
  }

  if (modifier.startsWith("talla-")) {
    const size = modifier.replace("talla-", "").trim();
    return size ? { categorySlug: categorySlug as SeoCategorySlug, size } : null;
  }

  return {
    categorySlug: categorySlug as SeoCategorySlug,
    location: capitalize(modifier),
  };
};

export const buildSeoPath = (route: SeoRoute) => {
  const base = `/${route.categorySlug}`;

  if (route.size) {
    return `${base}/talla-${normalizeSlugText(route.size)}`;
  }

  if (route.location) {
    return `${base}/${normalizeSlugText(route.location)}`;
  }

  return base;
};

export const buildSeoCopy = (route: SeoRoute, count: number) => {
  const category = categorySeo[route.categorySlug];
  const locationText = route.location ? ` en ${route.location}` : "";
  const sizeText = route.size ? ` talla ${route.size}` : "";
  const h1 = `${category.title}${locationText}${sizeText}`;
  const title = `${h1} | Faralaes`;
  const description = `Encuentra ${category.plural}${locationText}${sizeText} en Faralaes. ${count} anuncio${count === 1 ? "" : "s"} publicado${count === 1 ? "" : "s"} por usuarias de moda flamenca.`;
  const intro = route.location
    ? `Explora ${category.plural} disponibles en ${route.location}. Revisa fotos, estado, precio y opciones de contacto antes de decidir.`
    : route.size
      ? `Consulta anuncios de ${category.plural} talla ${route.size}, con prendas y complementos publicados por la comunidad de Faralaes.`
      : `Descubre ${category.plural} de segunda mano en Faralaes, con anuncios pensados para feria, romerias y celebraciones.`;

  return { description, h1, intro, title };
};

export const getCanonical = (path: string) => `${SITE_URL}${path}`;
