import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

const allowedActions = ["hide", "publish", "sold"] as const;
type ListingAction = (typeof allowedActions)[number];

const statusByAction: Record<ListingAction, string> = {
  hide: "hidden",
  publish: "published",
  sold: "sold",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAdmin(req, res);

  if (!user) {
    return;
  }

  if (req.method === "GET") {
    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          include: {
            profile: true,
          },
        },
      },
    });

    return res.status(200).json(listings);
  }

  if (req.method === "PATCH") {
    const { listingId, action } = req.body as {
      listingId?: unknown;
      action?: unknown;
    };

    if (typeof listingId !== "string") {
      return res.status(400).json({ error: "Anuncio no valido" });
    }

    if (
      typeof action !== "string" ||
      !allowedActions.includes(action as ListingAction)
    ) {
      return res.status(400).json({ error: "Accion no valida" });
    }

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { status: statusByAction[action as ListingAction] },
      include: {
        seller: {
          include: {
            profile: true,
          },
        },
      },
    });

    return res.status(200).json(listing);
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Metodo no permitido" });
}
