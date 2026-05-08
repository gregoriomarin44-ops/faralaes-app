import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await requireAdmin(req, res);

  if (!user) {
    return;
  }

  const [
    totalListings,
    publishedListings,
    pendingListings,
    totalUsers,
    pendingReports,
    latestListings,
    latestUsers,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "published" } }),
    prisma.listing.count({ where: { status: { in: ["pending", "draft"] } } }),
    prisma.user.count(),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.listing.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          include: {
            profile: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
      },
    }),
  ]);

  return res.status(200).json({
    totals: {
      totalListings,
      publishedListings,
      pendingListings,
      totalUsers,
      pendingReports,
    },
    latestListings,
    latestUsers,
  });
}
