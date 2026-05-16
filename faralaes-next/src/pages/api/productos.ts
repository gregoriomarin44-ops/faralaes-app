import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { requireSessionUser, requireVerifiedSessionUser } from "../../lib/auth";
import { normalizeAttributesForCategory } from "../../lib/listingOptions";
import { normalizeOperationType } from "../../lib/listingOperation";
import { prisma } from "../../lib/prisma";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type PublicListingFallback = {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  operationType: string | null;
  category: string;
  size: string | null;
  color: string | null;
  brand: string | null;
  usage: string | null;
  location: string | null;
  condition: string | null;
  attributes: Record<string, string | number | boolean> | null;
  status: string;
  shippingAvailable: boolean;
  whatsappContactAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: { url: string; sortOrder: number }[];
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logApiError = (
  endpoint: string,
  error: unknown,
  context: Record<string, unknown>
) => {
  console.error(`[${endpoint}] Error`, {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    ...context,
  });
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

const obtenerTamanoBase64 = (value: string) => {
  const base64 = value.includes(",") ? value.split(",").pop() || "" : value;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const prepararImagenes = (images: unknown): { images: string[]; error: string | null } => {
  if (images === undefined || images === null) {
    return { images: [], error: null };
  }

  if (!Array.isArray(images)) {
    return { images: [], error: "Las imágenes no tienen un formato válido." };
  }

  if (images.length > MAX_IMAGES) {
    return { images: [], error: "Puedes subir un máximo de 5 imágenes." };
  }

  if (!images.every((img) => typeof img === "string")) {
    return { images: [], error: "Las imágenes no tienen un formato válido." };
  }

  const imagenes = images as string[];

  const demasiadoGrande = imagenes.some(
    (img) => obtenerTamanoBase64(img) > MAX_IMAGE_BYTES
  );

  if (demasiadoGrande) {
    return { images: [], error: "Cada imagen debe pesar 2MB como máximo." };
  }

  return { images: imagenes, error: null };
};

const prepararOperacion = (operationType: unknown, priceCents: unknown) => {
  if (
    operationType !== undefined &&
    operationType !== "sale" &&
    operationType !== "donation"
  ) {
    return {
      error: "Tipo de operación no válido.",
      operationType: "sale" as const,
      priceCents: 0,
    };
  }

  const normalizedOperationType = normalizeOperationType(operationType);
  const normalizedPrice =
    typeof priceCents === "number" ? priceCents : Number(priceCents);

  if (normalizedOperationType === "donation") {
    return {
      error: null,
      operationType: normalizedOperationType,
      priceCents: 0,
    };
  }

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return {
      error: "El precio es obligatorio para anuncios de venta.",
      operationType: normalizedOperationType,
      priceCents: 0,
    };
  }

  return {
    error: null,
    operationType: normalizedOperationType,
    priceCents: Math.round(normalizedPrice),
  };
};

const añadirResumenReviews = async <T extends { sellerId: string }>(productos: T[]) => {
  const sellerIds = Array.from(new Set(productos.map((producto) => producto.sellerId)));

  if (sellerIds.length === 0) {
    return productos.map((producto) => ({
      ...producto,
      sellerRatingAverage: null,
      sellerReviewCount: 0,
    }));
  }

  type ReviewGroup = {
    reviewedUserId: string;
    _avg: { rating: number | null };
    _count: { _all: number };
  };

  let reviewGroups: ReviewGroup[] = [];

  try {
    const groups = await prisma.review.groupBy({
      by: ["reviewedUserId"] as const,
      where: {
        reviewedUserId: { in: sellerIds },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });
    reviewGroups = groups.map((group) => ({
      reviewedUserId: group.reviewedUserId,
      _avg: { rating: group._avg.rating },
      _count: { _all: group._count._all },
    }));
  } catch (error) {
    logApiError("/api/productos reviews", error, {
      filtrosRecibidos: {},
      queryParamsRecibidos: {},
      sellerIds,
    });
  }
  const reviewsBySeller = new Map(
    reviewGroups.map((group) => [
      group.reviewedUserId,
      {
        average: group._avg.rating,
        count: group._count._all,
      },
    ])
  );

  return productos.map((producto) => {
    const reviewSummary = reviewsBySeller.get(producto.sellerId);

    return {
      ...producto,
      sellerRatingAverage: reviewSummary?.average || null,
      sellerReviewCount: reviewSummary?.count || 0,
    };
  });
};

const cargarProductosPublicadosFallback = async (
  mine: boolean,
  userId: string | null
): Promise<PublicListingFallback[]> => {
  const sellerFilter =
    mine && userId
      ? Prisma.sql`AND "sellerId"::text = ${userId}`
      : Prisma.empty;

  const productos = await prisma.$queryRaw<Omit<PublicListingFallback, "images">[]>`
    SELECT
      "id"::text AS "id",
      "sellerId"::text AS "sellerId",
      "title",
      "description",
      "priceCents",
      "currency",
      'sale' AS "operationType",
      "category",
      "size",
      "color",
      NULL AS "brand",
      NULL AS "usage",
      "location",
      "condition",
      NULL AS "attributes",
      "status",
      "shippingAvailable",
      "whatsappContactAllowed",
      "createdAt",
      "updatedAt"
    FROM "Listing"
    WHERE "status" = 'published'
    ${sellerFilter}
    ORDER BY "createdAt" DESC
  `;

  const listingIds = productos.map((producto) => producto.id);

  if (listingIds.length === 0) {
    return [];
  }

  const images = await prisma.listingImage.findMany({
    where: { listingId: { in: listingIds } },
    orderBy: { sortOrder: "asc" },
    select: {
      listingId: true,
      url: true,
      sortOrder: true,
    },
  });
  const imagesByListingId = new Map<string, { url: string; sortOrder: number }[]>();

  images.forEach((image) => {
    const current = imagesByListingId.get(image.listingId) || [];
    current.push({ url: image.url, sortOrder: image.sortOrder });
    imagesByListingId.set(image.listingId, current);
  });

  return productos.map((producto) => ({
    ...producto,
    operationType: producto.operationType || "sale",
    attributes: null,
    images: imagesByListingId.get(producto.id) || [],
  }));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { mine } = req.query;

      const user = mine === "true" ? await requireSessionUser(req, res) : null;

      if (mine === "true" && !user) {
        return;
      }

      const productos = await prisma.listing.findMany({
        where: {
          status: "published",
          ...(mine === "true" && user ? { sellerId: user.id } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return res.status(200).json(await añadirResumenReviews(productos));
    }

    if (req.method === "POST") {
      const {
        title,
        description,
        priceCents,
        category,
        size,
        color,
        brand,
        usage,
        location,
        condition,
        operationType,
        attributes,
        shippingAvailable,
        whatsappContactAllowed,
        images,
      } = req.body;

      const operation = prepararOperacion(operationType, priceCents);

      if (operation.error) {
        return res.status(400).json({ error: operation.error });
      }

      if (!title || !category) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const user = await requireVerifiedSessionUser(req, res);

      if (!user) {
        return;
      }

      const { images: imagenes, error } = prepararImagenes(images);

      if (error) {
        return res.status(400).json({ error });
      }

      const producto = await prisma.listing.create({
        data: {
          title,
          description: description || null,
          priceCents: operation.priceCents,
          operationType: operation.operationType,
          sellerId: user.id,
          category,
          size: size || null,
          color: color || null,
          brand: brand || null,
          usage: usage || null,
          location: location || null,
          condition: condition || null,
          attributes: normalizeAttributesForCategory(category, attributes),
          shippingAvailable: Boolean(shippingAvailable),
          whatsappContactAllowed: Boolean(whatsappContactAllowed),
          status: "published",
          images:
            imagenes.length > 0
              ? {
                  create: imagenes.map((url, index) => ({
                    url,
                    sortOrder: index,
                  })),
                }
              : undefined,
        },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return res.status(201).json(producto);
    }

    if (req.method === "PUT") {
      const {
        id,
        title,
        description,
        priceCents,
        category,
        size,
        color,
        brand,
        usage,
        location,
        condition,
        operationType,
        attributes,
        shippingAvailable,
        whatsappContactAllowed,
        images,
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const user = await requireVerifiedSessionUser(req, res);

      if (!user) {
        return;
      }

      const operation = prepararOperacion(operationType, priceCents);

      if (operation.error) {
        return res.status(400).json({ error: operation.error });
      }

      if (!title || !category) {
        return res.status(400).json({
          error: "Título y categoría obligatorios",
        });
      }

      const productoActual = await prisma.listing.findUnique({
        where: { id },
        select: { sellerId: true },
      });

      if (!productoActual) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (productoActual.sellerId !== user.id) {
        return res.status(403).json({ error: "No autorizado" });
      }

      let nuevasImagenes: string[] | null = null;

      if (images !== undefined) {
        const prepared = prepararImagenes(images);

        if (prepared.error) {
          return res.status(400).json({ error: prepared.error });
        }

        nuevasImagenes = prepared.images;
      }

      const producto = await prisma.listing.update({
        where: { id },
        data: {
          title,
          description: description || null,
          priceCents: operation.priceCents,
          operationType: operation.operationType,
          category,
          size: size || null,
          color: color || null,
          brand: brand || null,
          usage: usage || null,
          location: location || null,
          condition: condition || null,
          attributes: normalizeAttributesForCategory(category, attributes),
          shippingAvailable: Boolean(shippingAvailable),
          whatsappContactAllowed: Boolean(whatsappContactAllowed),
          ...(nuevasImagenes !== null
            ? {
                images: {
                  deleteMany: {},
                  create: nuevasImagenes.map((url, index) => ({
                    url,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return res.status(200).json(producto);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const user = await requireVerifiedSessionUser(req, res);

      if (!user) {
        return;
      }

      const productoActual = await prisma.listing.findUnique({
        where: { id },
        select: { sellerId: true },
      });

      if (!productoActual) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (productoActual.sellerId !== user.id) {
        return res.status(403).json({ error: "No autorizado" });
      }

      await prisma.listing.delete({
        where: { id },
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    const queryParamsRecibidos = req.query;
    const filtrosRecibidos =
      req.method === "GET"
        ? {
            mine: req.query.mine,
          }
        : req.body;

    logApiError("/api/productos", error, {
      method: req.method,
      filtrosRecibidos,
      queryParamsRecibidos,
    });

    if (req.method === "GET") {
      try {
        const mine = req.query.mine === "true";
        const user = mine ? await requireSessionUser(req, res) : null;

        if (mine && !user) {
          return;
        }

        const fallbackProductos = await cargarProductosPublicadosFallback(
          mine,
          user?.id || null
        );

        return res.status(200).json(await añadirResumenReviews(fallbackProductos));
      } catch (fallbackError) {
        logApiError("/api/productos fallback", fallbackError, {
          method: req.method,
          filtrosRecibidos,
          queryParamsRecibidos,
        });
      }
    }

    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
