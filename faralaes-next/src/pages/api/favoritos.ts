import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId obligatorio" });
      }

      const favoritos = await prisma.favorite.findMany({
        where: {
          userId,
          listing: {
            status: "published",
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      return res.status(200).json(favoritos.map((favorito) => favorito.listing));
    }

    if (req.method === "POST") {
      const { userId, listingId } = req.body;

      if (!userId || !listingId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const favorito = await prisma.favorite.upsert({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
        update: {},
        create: {
          userId,
          listingId,
        },
      });

      return res.status(200).json(favorito);
    }

    if (req.method === "DELETE") {
      const { userId, listingId } = req.body;

      if (!userId || !listingId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      await prisma.favorite.deleteMany({
        where: {
          userId,
          listingId,
        },
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
