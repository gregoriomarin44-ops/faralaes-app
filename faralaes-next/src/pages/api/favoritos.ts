import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireSessionUser(req, res);

    if (!user) {
      return;
    }

    if (req.method === "GET") {
      const favoritos = await prisma.favorite.findMany({
        where: {
          userId: user.id,
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
      const { listingId } = req.body;

      if (!listingId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const favorito = await prisma.favorite.upsert({
        where: {
          userId_listingId: {
            userId: user.id,
            listingId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          listingId,
        },
      });

      return res.status(200).json(favorito);
    }

    if (req.method === "DELETE") {
      const { listingId } = req.body;

      if (!listingId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      await prisma.favorite.deleteMany({
        where: {
          userId: user.id,
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
