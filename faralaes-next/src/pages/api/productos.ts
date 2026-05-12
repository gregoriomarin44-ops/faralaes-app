import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser, requireVerifiedSessionUser } from "../../lib/auth";
import { normalizeAttributesForCategory } from "../../lib/listingOptions";
import { prisma } from "../../lib/prisma";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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

const añadirResumenReviews = async <T extends { sellerId: string }>(productos: T[]) => {
  const sellerIds = Array.from(new Set(productos.map((producto) => producto.sellerId)));

  if (sellerIds.length === 0) {
    return productos.map((producto) => ({
      ...producto,
      sellerRatingAverage: null,
      sellerReviewCount: 0,
    }));
  }

  const reviewGroups = await prisma.review.groupBy({
    by: ["reviewedUserId"],
    where: {
      reviewedUserId: { in: sellerIds },
    },
    _avg: { rating: true },
    _count: { _all: true },
  });
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
          seller: { disabled: false },
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
        attributes,
        shippingAvailable,
        whatsappContactAllowed,
        images,
      } = req.body;

      if (!title || !priceCents || !category) {
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
          priceCents,
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

      if (!title || !priceCents || !category) {
        return res.status(400).json({
          error: "Título, precio y categoría obligatorios",
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
          priceCents,
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
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
