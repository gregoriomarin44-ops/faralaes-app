import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { mine, userId } = req.query;

      if (mine === "true" && (!userId || typeof userId !== "string")) {
        return res.status(400).json({ error: "userId obligatorio" });
      }

      const productos = await prisma.listing.findMany({
        where: {
          status: "published",
          ...(mine === "true" && typeof userId === "string"
            ? { sellerId: userId }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return res.status(200).json(productos);
    }

    if (req.method === "POST") {
      const {
        title,
        description,
        priceCents,
        sellerId,
        category,
        size,
        color,
        location,
        condition,
        shippingAvailable,
        whatsappContactAllowed,
        image,
      } = req.body;

      if (!title || !priceCents || !sellerId || !category) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const producto = await prisma.listing.create({
        data: {
          title,
          description: description || null,
          priceCents,
          sellerId,
          category,
          size: size || null,
          color: color || null,
          location: location || null,
          condition: condition || null,
          shippingAvailable: Boolean(shippingAvailable),
          whatsappContactAllowed: Boolean(whatsappContactAllowed),
          status: "published",
          images: image
            ? {
                create: [
                  {
                    url: image,
                    sortOrder: 0,
                  },
                ],
              }
            : undefined,
        },
        include: {
          images: true,
        },
      });

      return res.status(201).json(producto);
    }

    if (req.method === "PUT") {
      const {
        id,
        userId,
        title,
        description,
        priceCents,
        category,
        size,
        color,
        location,
        condition,
        shippingAvailable,
        whatsappContactAllowed,
      } = req.body;

      if (!id || !userId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      if (!title || !priceCents || !category) {
        return res
          .status(400)
          .json({ error: "Título, precio y categoría obligatorios" });
      }

      const productoActual = await prisma.listing.findUnique({
        where: { id },
        select: {
          sellerId: true,
        },
      });

      if (!productoActual) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (productoActual.sellerId !== userId) {
        return res.status(403).json({ error: "No autorizado" });
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
          location: location || null,
          condition: condition || null,
          shippingAvailable: Boolean(shippingAvailable),
          whatsappContactAllowed: Boolean(whatsappContactAllowed),
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
      const { id, userId } = req.body;

      if (!id || !userId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const productoActual = await prisma.listing.findUnique({
        where: { id },
        select: {
          sellerId: true,
        },
      });

      if (!productoActual) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (productoActual.sellerId !== userId) {
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
