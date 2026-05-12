import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

const getDisplayName = (
  displayName: string | null | undefined,
  username: string | null | undefined
) => displayName?.trim() || (username ? `@${username}` : "Usuario Faralaes");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Usuario no válido." });
    }

    const [summary, reviews] = await Promise.all([
      prisma.review.aggregate({
        where: { reviewedUserId: userId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { reviewedUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          reviewer: {
            select: {
              username: true,
              displayName: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      average:
        typeof summary._avg.rating === "number" &&
        Number.isFinite(summary._avg.rating)
          ? summary._avg.rating
          : null,
      count: summary._count._all,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: {
          username: review.reviewer.username || "usuario",
          displayName: getDisplayName(
            review.reviewer.displayName,
            review.reviewer.username
          ),
        },
        listing: review.listing
          ? {
              id: review.listing.id,
              title: review.listing.title || "Anuncio",
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("No se han podido cargar las reviews del usuario.", error);
    return res.status(200).json({
      average: null,
      count: 0,
      reviews: [],
    });
  }
}
