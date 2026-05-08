import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  const enrichedReports = await Promise.all(
    reports.map(async (report) => {
      if (report.targetType === "listing") {
        const listing = await prisma.listing.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            title: true,
            status: true,
            sellerId: true,
          },
        });

        return { ...report, target: listing };
      }

      const user = await prisma.user.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          disabled: true,
        },
      });

      return { ...report, target: user };
    })
  );

  return res.status(200).json(enrichedReports);
}
