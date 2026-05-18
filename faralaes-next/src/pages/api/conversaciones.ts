import type { NextApiRequest, NextApiResponse } from "next";
import { requireVerifiedSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireVerifiedSessionUser(req, res);

    if (!user) {
      return;
    }

    if (req.method === "POST") {
      const { listingId } = req.body;

      if (!listingId) {
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

      if (listing.sellerId === user.id) {
        return res
          .status(400)
          .json({ error: "No puedes abrir conversación con tu propio anuncio" });
      }

      const existente = await prisma.conversation.findFirst({
        where: {
          listingId,
          buyerId: user.id,
        },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
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
          buyerId: user.id,
          sellerId: listing.sellerId,
        },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
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
      const conversaciones = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: user.id }, { sellerId: user.id }],
        },
        orderBy: { updatedAt: "desc" },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
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
