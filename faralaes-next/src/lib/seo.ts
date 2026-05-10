export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://faralaes.com";

export const categorySeo = {
  "trajes-flamenca": {
    category: "traje",
    plural: "trajes de flamenca",
    singular: "traje de flamenca",
    title: "Trajes de flamenca de segunda mano",
    colorRouteBase: "trajes-flamenca",
    supportsColor: true,
    supportsSize: true,
  },
  "zapatos-flamenca": {
    category: "zapatos",
    plural: "zapatos de flamenca",
    singular: "zapato de flamenca",
    title: "Zapatos de flamenca de segunda mano",
    colorRouteBase: "zapatos-flamenca",
    supportsColor: true,
    supportsSize: true,
  },
  "complementos-flamencos": {
    category: "complementos",
    plural: "complementos flamencos",
    singular: "complemento flamenco",
    title: "Complementos flamencos de segunda mano",
    colorRouteBase: "complementos-flamencos",
    supportsColor: true,
    supportsSize: false,
  },
  "abanicos-flamencos": {
    category: "abanicos",
    plural: "abanicos flamencos",
    singular: "abanico flamenco",
    title: "Abanicos flamencos de segunda mano",
    colorRouteBase: "abanicos-flamencos",
    supportsColor: true,
    supportsSize: false,
  },
  "mantoncillos-flamencos": {
    category: "mantoncillo",
    plural: "mantoncillos flamencos",
    singular: "mantoncillo flamenco",
    title: "Mantoncillos flamencos de segunda mano",
    colorRouteBase: "mantoncillos",
    supportsColor: true,
    supportsSize: false,
  },
  "moda-flamenca-nina": {
    category: "nina",
    plural: "prendas flamencas de niña",
    singular: "prenda flamenca de niña",
    title: "Moda flamenca de niña de segunda mano",
    colorRouteBase: "moda-flamenca-nina",
    supportsColor: true,
    supportsSize: true,
  },
  "moda-flamenca-hombre": {
    category: "hombre",
    plural: "prendas flamencas de hombre",
    singular: "prenda flamenca de hombre",
    title: "Moda flamenca de hombre de segunda mano",
    colorRouteBase: "moda-flamenca-hombre",
    supportsColor: true,
    supportsSize: true,
  },
  "flores-flamencas": {
    category: "flores",
    plural: "flores flamencas",
    singular: "flor flamenca",
    title: "Flores flamencas de segunda mano",
    colorRouteBase: "flores-flamencas",
    supportsColor: true,
    supportsSize: false,
  },
  "pendientes-flamencos": {
    category: "pendientes",
    plural: "pendientes flamencos",
    singular: "pendiente flamenco",
    title: "Pendientes flamencos de segunda mano",
    colorRouteBase: "pendientes-flamencos",
    supportsColor: true,
    supportsSize: false,
  },
  "peinetas-flamencas": {
    category: "peinetas",
    plural: "peinetas flamencas",
    singular: "peineta flamenca",
    title: "Peinetas flamencas de segunda mano",
    colorRouteBase: "peinetas-flamencas",
    supportsColor: true,
    supportsSize: false,
  },
  "bolsos-flamencos": {
    category: "bolsos",
    plural: "bolsos flamencos",
    singular: "bolso flamenco",
    title: "Bolsos flamencos de segunda mano",
    colorRouteBase: "bolsos-flamencos",
    supportsColor: true,
    supportsSize: false,
  },
  "moda-rociera": {
    category: "moda_rociera",
    plural: "moda rociera",
    singular: "prenda rociera",
    title: "Moda rociera de segunda mano",
    colorRouteBase: "moda-rociera",
    supportsColor: true,
    supportsSize: true,
  },
  otros: {
    category: "otros",
    plural: "otros artículos flamencos",
    singular: "artículo flamenco",
    title: "Otros artículos flamencos de segunda mano",
    colorRouteBase: "otros",
    supportsColor: true,
    supportsSize: false,
  },
} as const;

export const seoCities = [
  { slug: "sevilla", label: "Sevilla" },
  { slug: "huelva", label: "Huelva" },
  { slug: "cadiz", label: "Cádiz" },
  { slug: "cordoba", label: "Córdoba" },
  { slug: "malaga", label: "Málaga" },
  { slug: "granada", label: "Granada" },
  { slug: "jaen", label: "Jaén" },
  { slug: "madrid", label: "Madrid" },
] as const;

export const seoColors = [
  { slug: "rojos", label: "Rojo", text: "rojos" },
  { slug: "negros", label: "Negro", text: "negros" },
  { slug: "blancos", label: "Blanco", text: "blancos" },
  { slug: "marfil", label: "Marfil", text: "marfil" },
  { slug: "azules", label: "Azul", text: "azules" },
  { slug: "verdes", label: "Verde", text: "verdes" },
  { slug: "rosas", label: "Rosa", text: "rosas" },
  { slug: "amarillos", label: "Amarillo", text: "amarillos" },
  { slug: "morados", label: "Morado", text: "morados" },
  { slug: "naranjas", label: "Naranja", text: "naranjas" },
  { slug: "multicolor", label: "Multicolor", text: "multicolor" },
] as const;

export const seoSizes = [
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
] as const;

export type SeoCategorySlug = keyof typeof categorySeo;
export type SeoPageKind = "category" | "city" | "color" | "size";

export type SeoFilters = {
  category: string;
  location?: string;
  color?: string;
  size?: string;
};

export type SeoRoute = {
  categorySlug: SeoCategorySlug;
  citySlug?: string;
  colorSlug?: string;
  size?: string;
  kind: SeoPageKind;
  slug: string;
  filters: SeoFilters;
};

export type SeoPage = SeoRoute & {
  canonical: string;
  h1: string;
  introText: string;
  metaDescription: string;
  title: string;
};

export const seoCategorySlugs = Object.keys(categorySeo) as SeoCategorySlug[];

export const getSeoCategorySlugByCategory = (category: string) =>
  seoCategorySlugs.find((slug) => categorySeo[slug].category === category) ||
  null;

export const normalizeSlugText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getCanonical = (path: string) => `${SITE_URL}${path}`;

const findCityBySlug = (slug: string) =>
  seoCities.find((city) => city.slug === normalizeSlugText(slug));

const findColorBySlug = (slug: string) =>
  seoColors.find((color) => color.slug === normalizeSlugText(slug));

const findColorByText = (value: string) =>
  seoColors.find(
    (color) =>
      color.slug === normalizeSlugText(value) ||
      normalizeSlugText(color.label) === normalizeSlugText(value)
  );

const normalizeSize = (value: string) => normalizeSlugText(value).toLowerCase();

const formatSize = (value: string) =>
  /^[a-z]+$/.test(value) ? value.toUpperCase() : value;

const categorySupportsColor = (categorySlug: SeoCategorySlug) =>
  categorySeo[categorySlug].supportsColor;

const categorySupportsSize = (categorySlug: SeoCategorySlug) =>
  categorySeo[categorySlug].supportsSize;

export const buildSeoPath = (route: Pick<SeoRoute, "categorySlug"> & {
  citySlug?: string;
  colorSlug?: string;
  location?: string;
  size?: string;
}) => {
  const category = categorySeo[route.categorySlug];

  if (route.colorSlug) {
    return `/${category.colorRouteBase}-${route.colorSlug}`;
  }

  if (route.size) {
    return `/${route.categorySlug}-talla-${normalizeSize(route.size)}`;
  }

  if (route.citySlug || route.location) {
    return `/${route.categorySlug}/${route.citySlug || normalizeSlugText(route.location || "")}`;
  }

  return `/${route.categorySlug}`;
};

export const parseSeoRoute = (slug: string[] | string | undefined): SeoRoute | null => {
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : [];

  if (parts.length === 1) {
    const [singleSlug] = parts;

    if (seoCategorySlugs.includes(singleSlug as SeoCategorySlug)) {
      const categorySlug = singleSlug as SeoCategorySlug;
      const category = categorySeo[categorySlug];

      return {
        categorySlug,
        filters: { category: category.category },
        kind: "category",
        slug: buildSeoPath({ categorySlug }),
      };
    }

    for (const categorySlug of seoCategorySlugs) {
      const category = categorySeo[categorySlug];
      const colorPrefix = `${category.colorRouteBase}-`;
      const sizePrefix = `${categorySlug}-talla-`;

      if (categorySupportsColor(categorySlug) && singleSlug.startsWith(colorPrefix)) {
        const colorSlug = singleSlug.slice(colorPrefix.length);
        const color = findColorBySlug(colorSlug);

        if (color) {
          return {
            categorySlug,
            colorSlug: color.slug,
            filters: { category: category.category, color: color.label },
            kind: "color",
            slug: buildSeoPath({ categorySlug, colorSlug: color.slug }),
          };
        }
      }

      if (categorySupportsSize(categorySlug) && singleSlug.startsWith(sizePrefix)) {
        const size = normalizeSize(singleSlug.slice(sizePrefix.length));

        if (seoSizes.includes(size as (typeof seoSizes)[number])) {
          return {
            categorySlug,
            filters: { category: category.category, size: formatSize(size) },
            kind: "size",
            size: formatSize(size),
            slug: buildSeoPath({ categorySlug, size }),
          };
        }
      }
    }
  }

  if (parts.length === 2) {
    const [categorySlug, citySlug] = parts;

    if (!seoCategorySlugs.includes(categorySlug as SeoCategorySlug)) {
      return null;
    }

    const city = findCityBySlug(citySlug);

    if (!city) {
      return null;
    }

    const normalizedCategorySlug = categorySlug as SeoCategorySlug;
    const category = categorySeo[normalizedCategorySlug];

    return {
      categorySlug: normalizedCategorySlug,
      citySlug: city.slug,
      filters: { category: category.category, location: city.label },
      kind: "city",
      slug: buildSeoPath({ categorySlug: normalizedCategorySlug, citySlug: city.slug }),
    };
  }

  return null;
};

export const buildSeoCopy = (route: SeoRoute, count: number) => {
  const category = categorySeo[route.categorySlug];
  const locationText = route.filters.location ? ` en ${route.filters.location}` : "";
  const sizeText = route.filters.size ? ` talla ${route.filters.size}` : "";
  const color = route.colorSlug ? findColorBySlug(route.colorSlug) : null;
  const colorText = color ? ` ${color.text}` : "";
  const h1 = `${category.title}${locationText}${colorText}${sizeText}`;
  const title = `${h1} | Faralaes`;
  const metaDescription = `Encuentra ${category.plural}${locationText}${colorText}${sizeText} en Faralaes. ${count} anuncio${count === 1 ? "" : "s"} publicado${count === 1 ? "" : "s"} por usuarias de moda flamenca.`;
  const introText =
    route.kind === "city" && route.filters.location
      ? `Explora ${category.plural} disponibles en ${route.filters.location}. Revisa fotos, estado, precio y opciones de contacto antes de decidir.`
      : route.kind === "color" && color
        ? `Consulta anuncios de ${category.plural} ${color.text}, una selección enfocada para encontrar color, precio y estilo sin pasar por filtros genéricos.`
        : route.kind === "size" && route.filters.size
          ? `Consulta anuncios de ${category.plural} talla ${route.filters.size}, con prendas y complementos publicados por la comunidad de Faralaes.`
          : `Descubre ${category.plural} de segunda mano en Faralaes, con anuncios pensados para feria, romerías y celebraciones.`;

  return { h1, introText, metaDescription, title };
};

export const getSeoPage = (slug: string[] | string | undefined, count = 0): SeoPage | null => {
  const route = parseSeoRoute(slug);

  if (!route) {
    return null;
  }

  const copy = buildSeoCopy(route, count);

  return {
    ...route,
    canonical: getCanonical(route.slug),
    ...copy,
  };
};

export const getSeoLinksForCategory = (categorySlug: SeoCategorySlug) => {
  const category = categorySeo[categorySlug];
  const cities = seoCities.slice(0, 4).map((city) => ({
    href: buildSeoPath({ categorySlug, citySlug: city.slug }),
    label: `${category.plural} en ${city.label}`,
  }));
  const colors = categorySupportsColor(categorySlug)
    ? seoColors.slice(0, 5).map((color) => ({
        href: buildSeoPath({ categorySlug, colorSlug: color.slug }),
        label: `${category.plural} ${color.text}`,
      }))
    : [];
  const sizes = categorySupportsSize(categorySlug)
    ? seoSizes.slice(0, 8).map((size) => ({
        href: buildSeoPath({ categorySlug, size }),
        label: `${category.plural} talla ${formatSize(size)}`,
      }))
    : [];

  return { cities, colors, sizes };
};

export const getSeoProductLinks = ({
  category,
  color,
  location,
  size,
}: {
  category: string;
  color?: string | null;
  location?: string | null;
  size?: string | null;
}) => {
  const categorySlug = getSeoCategorySlugByCategory(category);

  if (!categorySlug) {
    return [];
  }

  const normalizedCity = location ? findCityBySlug(normalizeSlugText(location)) : null;
  const normalizedColor = color ? findColorByText(color) : null;
  const normalizedSize = size ? normalizeSize(size) : "";

  return [
    {
      href: buildSeoPath({ categorySlug }),
      label: categorySeo[categorySlug].plural,
    },
    normalizedCity
      ? {
          href: buildSeoPath({ categorySlug, citySlug: normalizedCity.slug }),
          label: `${categorySeo[categorySlug].plural} en ${normalizedCity.label}`,
        }
      : null,
    normalizedColor && categorySupportsColor(categorySlug)
      ? {
          href: buildSeoPath({ categorySlug, colorSlug: normalizedColor.slug }),
          label: `${categorySeo[categorySlug].plural} ${normalizedColor.text}`,
        }
      : null,
    normalizedSize &&
    categorySupportsSize(categorySlug) &&
    seoSizes.includes(normalizedSize as (typeof seoSizes)[number])
      ? {
          href: buildSeoPath({ categorySlug, size: normalizedSize }),
          label: `${categorySeo[categorySlug].plural} talla ${formatSize(normalizedSize)}`,
        }
      : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));
};

export const primarySeoFooterLinks = seoCategorySlugs.slice(0, 8).map((categorySlug) => ({
  href: buildSeoPath({ categorySlug }),
  label: categorySeo[categorySlug].title.replace(" de segunda mano", ""),
}));
