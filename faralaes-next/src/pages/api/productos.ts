import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const productos = await prisma.listing.findMany({
        where: { status: "published" },
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

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}