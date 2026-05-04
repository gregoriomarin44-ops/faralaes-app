import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      const { listingId, buyerId } = req.body;

      if (!listingId || !buyerId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          sellerId: true,
        },
      });

      if (!listing) {
        return res.status(404).json({ error: "Anuncio no encontrado" });
      }

      if (listing.sellerId === buyerId) {
        return res
          .status(400)
          .json({ error: "No puedes abrir conversación con tu propio anuncio" });
      }

      const existente = await prisma.conversation.findFirst({
        where: {
          listingId,
          buyerId,
        },
        include: {
          listing: true,
          buyer: {
            include: {
              profile: true,
            },
          },
          seller: {
            include: {
              profile: true,
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (existente) {
        return res.status(200).json(existente);
      }

      const conversation = await prisma.conversation.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
        },
        include: {
          listing: true,
          buyer: {
            include: {
              profile: true,
            },
          },
          seller: {
            include: {
              profile: true,
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return res.status(201).json(conversation);
    }

    if (req.method === "GET") {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId obligatorio" });
      }

      const conversaciones = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        orderBy: { updatedAt: "desc" },
        include: {
          listing: true,
          buyer: {
            include: {
              profile: true,
            },
          },
          seller: {
            include: {
              profile: true,
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return res.status(200).json(conversaciones);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
