import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

const allowedActions = ["hide", "publish", "sold"] as const;
type ListingAction = (typeof allowedActions)[number];

const statusByAction: Record<ListingAction, string> = {
  hide: "hidden",
  publish: "published",
  sold: "sold",
};

type AdminListingResponse = {
  id: string;
  title: string;
  priceCents: number;
  status: string;
  createdAt: Date;
  seller: {
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
};

const adminListingSelect = {
  id: true,
  title: true,
  priceCents: true,
  status: true,
  createdAt: true,
  seller: {
    select: {
      email: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  },
} satisfies Prisma.ListingSelect;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logApiError = (
  endpoint: string,
  error: unknown,
  context: Record<string, unknown> = {}
) => {
  console.error(`[${endpoint}] Error`, {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    ...context,
  });
};

const cargarAdminListingsFallback = async (
  listingId?: string
): Promise<AdminListingResponse[]> => {
  const idFilter = listingId ? Prisma.sql`WHERE l."id"::text = ${listingId}` : Prisma.empty;

  const rows = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      priceCents: number;
      status: string;
      createdAt: Date;
      sellerEmail: string;
      sellerDisplayName: string | null;
    }[]
  >`
    SELECT
      l."id"::text AS "id",
      l."title",
      l."priceCents",
      l."status",
      l."createdAt",
      u."email" AS "sellerEmail",
      p."displayName" AS "sellerDisplayName"
    FROM "Listing" l
    INNER JOIN "User" u ON u."id" = l."sellerId"
    LEFT JOIN "Profile" p ON p."userId" = u."id"
    ${idFilter}
    ORDER BY l."createdAt" DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    priceCents: row.priceCents,
    status: row.status,
    createdAt: row.createdAt,
    seller: {
      email: row.sellerEmail,
      profile: row.sellerDisplayName
        ? {
            displayName: row.sellerDisplayName,
          }
        : null,
    },
  }));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireAdmin(req, res);

    if (!user) {
      return;
    }

    if (req.method === "GET") {
      try {
        const listings = await prisma.listing.findMany({
          orderBy: { createdAt: "desc" },
          select: adminListingSelect,
        });

        return res.status(200).json(listings);
      } catch (error) {
        logApiError("/api/admin/listings GET", error, {
          queryParamsRecibidos: req.query,
        });

        const fallbackListings = await cargarAdminListingsFallback();

        return res.status(200).json(fallbackListings);
      }
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

      try {
        const listing = await prisma.listing.update({
          where: { id: listingId },
          data: { status: statusByAction[action as ListingAction] },
          select: adminListingSelect,
        });

        return res.status(200).json(listing);
      } catch (error) {
        logApiError("/api/admin/listings PATCH", error, {
          body: req.body,
        });

        await prisma.$executeRaw`
          UPDATE "Listing"
          SET "status" = ${statusByAction[action as ListingAction]}, "updatedAt" = NOW()
          WHERE "id"::text = ${listingId}
        `;

        const [listing] = await cargarAdminListingsFallback(listingId);

        if (!listing) {
          return res.status(404).json({ error: "Anuncio no encontrado" });
        }

        return res.status(200).json(listing);
      }
    }

    if (req.method === "DELETE") {
      const { listingId } = req.body as {
        listingId?: unknown;
      };

      if (typeof listingId !== "string") {
        return res.status(400).json({ error: "Anuncio no valido" });
      }

      try {
        await prisma.listing.delete({
          where: { id: listingId },
        });
      } catch (error) {
        logApiError("/api/admin/listings DELETE", error, {
          body: req.body,
        });

        await prisma.$executeRaw`
          DELETE FROM "Listing"
          WHERE "id"::text = ${listingId}
        `;
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    return res.status(405).json({ error: "Metodo no permitido" });
  } catch (error) {
    logApiError("/api/admin/listings", error, {
      method: req.method,
      queryParamsRecibidos: req.query,
      body: req.body,
    });

    return res.status(500).json({
      error: "No se han podido cargar los anuncios.",
    });
  }
}
