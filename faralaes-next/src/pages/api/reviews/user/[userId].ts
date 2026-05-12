import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

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
      average: summary._avg.rating || null,
      count: summary._count._all,
      reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
