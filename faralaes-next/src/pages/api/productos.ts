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
        title: req.body.title,
        description: req.body.description,
        priceCents: req.body.priceCents,
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

  return res.status(405).json({ error: "Método no permitido" });
}