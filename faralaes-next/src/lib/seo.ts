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
  "mantoncillos": {
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
  "flores-flamenca": {
    category: "flores",
    plural: "flores flamencas",
    singular: "flor flamenca",
    title: "Flores flamencas de segunda mano",
    colorRouteBase: "flores-flamenca",
    supportsColor: true,
    supportsSize: false,
  },
  "pendientes-flamenca": {
    category: "pendientes",
    plural: "pendientes flamencos",
    singular: "pendiente flamenco",
    title: "Pendientes flamencos de segunda mano",
    colorRouteBase: "pendientes-flamenca",
    supportsColor: true,
    supportsSize: false,
  },
  "peinetas-flamenca": {
    category: "peinetas",
    plural: "peinetas flamencas",
    singular: "peineta flamenca",
    title: "Peinetas flamencas de segunda mano",
    colorRouteBase: "peinetas-flamenca",
    supportsColor: true,
    supportsSize: false,
  },
  "bolsos-flamenca": {
    category: "bolsos",
    plural: "bolsos flamencos",
    singular: "bolso flamenco",
    title: "Bolsos flamencos de segunda mano",
    colorRouteBase: "bolsos-flamenca",
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
  faqs: SeoFaq[];
  h1: string;
  introText: string;
  metaDescription: string;
  title: string;
};

export type SeoFaq = {
  answer: string;
  question: string;
};

export const seoCategorySlugs = Object.keys(categorySeo) as SeoCategorySlug[];

export const primarySeoCategorySlugs = [
  "trajes-flamenca",
  "zapatos-flamenca",
  "complementos-flamencos",
  "mantoncillos",
  "abanicos-flamencos",
  "flores-flamenca",
  "pendientes-flamenca",
  "peinetas-flamenca",
  "bolsos-flamenca",
  "moda-flamenca-nina",
  "moda-flamenca-hombre",
] as const satisfies readonly SeoCategorySlug[];

const seoCategorySlugAliases: Partial<Record<string, SeoCategorySlug>> = {
  "mantoncillos-flamencos": "mantoncillos",
  "flores-flamencas": "flores-flamenca",
  "pendientes-flamencos": "pendientes-flamenca",
  "peinetas-flamencas": "peinetas-flamenca",
  "abanicos-flamenca": "abanicos-flamencos",
  "bolsos-flamencos": "bolsos-flamenca",
};

const seoCategorySlugAliasEntries = Object.entries(
  seoCategorySlugAliases
) as [string, SeoCategorySlug][];

const getCanonicalCategorySlug = (slug: string) =>
  seoCategorySlugAliases[slug] || (slug as SeoCategorySlug);

export const getCanonicalSeoPathForSlug = (
  slug: string[] | string | undefined
) => parseSeoRoute(slug)?.slug || null;

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

export const shouldNoindexSeoRoute = ({
  hasNonCanonicalQuery,
  listingCount,
  route,
}: {
  hasNonCanonicalQuery: boolean;
  listingCount: number;
  route: SeoRoute;
}) => {
  if (hasNonCanonicalQuery) {
    return true;
  }

  return route.kind !== "category" && listingCount === 0;
};

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

const capitalizeFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const pickBySlug = <T,>(items: readonly T[], slug: string, offset = 0) => {
  const score = slug.split("").reduce((total, character) => {
    return total + character.charCodeAt(0);
  }, offset);

  return items[score % items.length];
};

const introOpeners = [
  "En Faralaes reunimos anuncios actualizados",
  "Esta selección agrupa anuncios publicados en Faralaes",
  "Aquí puedes comparar anuncios de particulares y tiendas",
  "Si buscas moda flamenca con encanto y buen precio, esta página reúne opciones",
  "Para preparar feria, romería o cualquier evento flamenco, hemos organizado anuncios",
] as const;

const seoCtas = [
  "Revisa fotos, tallas, estado y precio antes de contactar.",
  "Guarda las opciones que encajen contigo y habla directamente con la persona vendedora.",
  "Compara estilos, colores y ubicaciones sin depender de búsquedas genéricas.",
  "Consulta cada ficha para ver detalles del anuncio y formas de contacto disponibles.",
] as const;

const flamencoReferences = [
  "ferias, romerías y celebraciones flamencas",
  "feria, camino del Rocío y eventos de moda flamenca",
  "temporada de feria, romerías y actuaciones",
  "looks flamencos completos, desde el traje hasta los complementos",
] as const;

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
    const normalizedSingleSlug = getCanonicalCategorySlug(singleSlug);

    if (seoCategorySlugs.includes(normalizedSingleSlug as SeoCategorySlug)) {
      const categorySlug = normalizedSingleSlug as SeoCategorySlug;
      const category = categorySeo[categorySlug];

      return {
        categorySlug,
        filters: { category: category.category },
        kind: "category",
        slug: buildSeoPath({ categorySlug }),
      };
    }

    for (const [legacyPrefix, categorySlug] of seoCategorySlugAliasEntries) {
      const colorPrefix = `${legacyPrefix}-`;

      if (categorySupportsColor(categorySlug) && singleSlug.startsWith(colorPrefix)) {
        const colorSlug = singleSlug.slice(colorPrefix.length);
        const color = findColorBySlug(colorSlug);

        if (color) {
          return {
            categorySlug,
            colorSlug: color.slug,
            filters: { category: categorySeo[categorySlug].category, color: color.label },
            kind: "color",
            slug: buildSeoPath({ categorySlug, colorSlug: color.slug }),
          };
        }
      }
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
    const normalizedCategorySlug = getCanonicalCategorySlug(categorySlug);

    if (!seoCategorySlugs.includes(normalizedCategorySlug as SeoCategorySlug)) {
      return null;
    }

    const city = findCityBySlug(citySlug);

    if (!city) {
      return null;
    }

    const canonicalCategorySlug = normalizedCategorySlug as SeoCategorySlug;
    const category = categorySeo[canonicalCategorySlug];

    return {
      categorySlug: canonicalCategorySlug,
      citySlug: city.slug,
      filters: { category: category.category, location: city.label },
      kind: "city",
      slug: buildSeoPath({ categorySlug: canonicalCategorySlug, citySlug: city.slug }),
    };
  }

  return null;
};

const buildSeoFaqs = (route: SeoRoute): SeoFaq[] => {
  const category = categorySeo[route.categorySlug];
  const color = route.colorSlug ? findColorBySlug(route.colorSlug) : null;
  const categoryText = category.plural;
  const locationText = route.filters.location ? ` en ${route.filters.location}` : "";
  const colorText = color ? ` ${color.text}` : "";
  const sizeText = route.filters.size ? ` talla ${route.filters.size}` : "";
  const scopedCategory = `${categoryText}${locationText}${colorText}${sizeText}`;
  const firstQuestion =
    route.kind === "city" && route.filters.location
      ? `¿Dónde comprar ${categoryText} en ${route.filters.location}?`
      : route.kind === "color" && color
        ? `¿Dónde encontrar ${categoryText} ${color.text}?`
        : route.kind === "size" && route.filters.size
          ? `¿Hay ${categoryText} talla ${route.filters.size}?`
          : `¿Hay ${categoryText} de segunda mano?`;

  return [
    {
      question: firstQuestion,
      answer: `En Faralaes puedes consultar anuncios de ${scopedCategory} publicados por particulares y tiendas. Cada ficha muestra fotos, precio, ubicación y detalles para ayudarte a comparar antes de contactar.`,
    },
    {
      question: `¿Sirven estos anuncios para feria y romerías?`,
      answer: `Sí. Las categorías de Faralaes están pensadas para moda flamenca, feria, romerías y eventos relacionados con el flamenco. Revisa la descripción de cada anuncio para confirmar estado, medidas y uso recomendado.`,
    },
    {
      question: `¿Cómo contactar con vendedores de ${categoryText}?`,
      answer: `Abre la ficha del anuncio que te interese y usa las opciones de contacto disponibles. Faralaes muestra la información esencial del producto para que puedas preguntar con contexto y cerrar los detalles directamente.`,
    },
  ];
};

export const buildSeoCopy = (route: SeoRoute, count: number) => {
  const category = categorySeo[route.categorySlug];
  const color = route.colorSlug ? findColorBySlug(route.colorSlug) : null;
  const categoryName = capitalizeFirst(category.plural);
  const reference = pickBySlug(flamencoReferences, route.slug);
  const opener = pickBySlug(introOpeners, route.slug, 7);
  const cta = pickBySlug(seoCtas, route.slug, 13);
  const listingCountText =
    count > 0
      ? `Ahora mismo hay ${count} anuncio${count === 1 ? "" : "s"} activo${count === 1 ? "" : "s"} para esta búsqueda.`
      : route.kind === "category"
        ? "Si ahora hay poca oferta, la página sigue abierta para que puedas volver y encontrar nuevos anuncios publicados."
        : "Cuando no haya anuncios disponibles en filtros muy específicos, mantenemos la página fuera de indexación hasta que vuelva a tener oferta útil.";

  const h1 =
    route.kind === "city" && route.filters.location
      ? `${categoryName} en ${route.filters.location}`
      : route.kind === "color" && color
        ? `${categoryName} ${color.text}`
        : route.kind === "size" && route.filters.size
          ? `${categoryName} talla ${route.filters.size}`
          : `${categoryName} nuevos y de segunda mano`;
  const scopedDescription = `${category.plural}${route.filters.location ? ` en ${route.filters.location}` : ""}${color ? ` ${color.text}` : ""}${route.filters.size ? ` talla ${route.filters.size}` : ""}`;

  const title =
    route.kind === "category"
      ? `${categoryName} nuevos y de segunda mano | Faralaes`
      : `${h1} | Faralaes`;

  const metaDescription =
    `Compra, vende, dona o regala trajes de flamenca y moda flamenca de segunda mano en Faralaes: ${scopedDescription}.`.slice(
      0,
      160
    );

  const introText =
    route.kind === "city" && route.filters.location
      ? `${opener} de ${category.plural} en ${route.filters.location}, pensados para quien quiere comprar cerca o valorar envíos antes de decidir. Puedes encontrar piezas para ${reference}, con estilos clásicos, opciones más actuales y anuncios de segunda mano que ayudan a alargar la vida de la moda flamenca. ${listingCountText} ${cta} Faralaes facilita descubrir prendas y complementos con contexto real: ubicación, talla, color, estado y precio visible desde la ficha.`
      : route.kind === "color" && color
        ? `${opener} de ${category.plural} ${color.text}, una forma sencilla de empezar por el color cuando ya tienes claro el aire del conjunto. Esta landing ayuda a comparar opciones para ${reference}, desde piezas sobrias hasta combinaciones más llamativas dentro de la moda flamenca. ${listingCountText} ${cta} Cada anuncio enlaza a su ficha para ver imágenes, detalles y contacto sin generar filtros infinitos.`
        : route.kind === "size" && route.filters.size
          ? `${opener} de ${category.plural} talla ${route.filters.size}, útil cuando la prioridad es encontrar una prenda que encaje desde el primer vistazo. Reúne anuncios para feria, romerías y eventos flamencos, con información práctica sobre estado, precio, color y ubicación. ${listingCountText} ${cta} Así puedes comparar alternativas reales sin perderte entre búsquedas internas o combinaciones poco útiles.`
          : `${opener} de ${category.plural} nuevos y de segunda mano para preparar ${reference}. La selección está pensada para comprar, vender, regalar o donar moda flamenca con fotos y detalles claros, tanto si buscas una pieza principal como si quieres dar segunda vida a un conjunto. ${listingCountText} ${cta} También puedes seguir navegando por ciudad, color o talla cuando esas rutas tengan sentido para la categoría.`;

  return {
    faqs: buildSeoFaqs(route),
    h1,
    introText,
    metaDescription,
    title,
  };
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

export const primarySeoFooterLinks = primarySeoCategorySlugs.slice(0, 8).map((categorySlug) => ({
  href: buildSeoPath({ categorySlug }),
  label: categorySeo[categorySlug].title.replace(" de segunda mano", ""),
}));
