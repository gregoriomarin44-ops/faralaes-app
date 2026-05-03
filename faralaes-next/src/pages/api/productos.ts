import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const productos = await prisma.listing.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(productos);
  }

  if (req.method === "POST") {
    const producto = await prisma.listing.create({
      data: {
        title: "Traje flamenca prueba",
        description: "Anuncio de prueba creado desde API",
        priceCents: 12000,
        category: "traje",
        size: "M",
        color: "Rojo",
        location: "Sevilla",
        condition: "muy_bueno",
        sellerId: req.body.sellerId,
      },
    });

    return res.status(201).json(producto);
  }

  res.status(405).json({ error: "Método no permitido" });
}