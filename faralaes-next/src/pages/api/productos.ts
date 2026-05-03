import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // =========================
    // GET → LISTAR PRODUCTOS
    // =========================
    if (req.method === "GET") {
      const productos = await prisma.listing.findMany({
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        include: {
          images: true, // 👈 IMPORTANTE para el catálogo
        },
      });

      return res.status(200).json(productos);
    }

    // =========================
    // POST → CREAR PRODUCTO
    // =========================
    if (req.method === "POST") {
      const {
        title,
        description,
        priceCents,
        sellerId,
        image, // 👈 base64 opcional
      } = req.body;

      if (!title || !priceCents || !sellerId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const producto = await prisma.listing.create({
        data: {
          title,
          description,
          priceCents,
          category: "traje",
          size: "M",
          color: "Rojo",
          location: "Sevilla",
          condition: "muy_bueno",
          sellerId,

          // 👇 crear imagen si viene
          images: image
            ? {
                create: [
                  {
                    url: image, // base64 o URL
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