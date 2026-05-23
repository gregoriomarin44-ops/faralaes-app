import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { getSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logApiError = (
  endpoint: string,
  error: unknown,
  context: Record<string, unknown>
) => {
  console.error(`[${endpoint}] Error`, {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    ...context,
  });
};

const logApiInfo = (event: string, context: Record<string, unknown>) => {
  console.info(`[${event}]`, context);
};

const getSingleQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getAdminState = async (req: NextApiRequest) => {
  let currentUser = null;

  try {
    currentUser = await getSessionUser(req);
  } catch (error) {
    logApiError("/api/productos/[id] session lookup", error, {
      listingId: getSingleQueryValue(req.query.id),
      userId: null,
      isAdmin: false,
    });
  }

  if (currentUser) {
    return {
      userId: currentUser.id,
      isAdmin: currentUser.role === "ADMIN",
    };
  }

  const adminUserId = getSingleQueryValue(req.query.adminUserId);

  if (!adminUserId) {
    return { userId: null, isAdmin: false };
  }

  try {
    const [adminUser] = await prisma.$queryRaw<{ role: string }[]>`
      SELECT "role"
      FROM "User"
      WHERE "id"::text = ${adminUserId}
      LIMIT 1
    `;

    return {
      userId: adminUserId,
      isAdmin: adminUser?.role === "ADMIN",
    };
  } catch (error) {
    logApiError("/api/productos/[id] admin lookup", error, {
      listingId: getSingleQueryValue(req.query.id),
      userId: adminUserId,
      isAdmin: false,
    });

    return { userId: adminUserId, isAdmin: false };
  }
};

const loadProductFallback = async (id: string, isAdmin: boolean) => {
  logApiInfo("/api/productos/[id] fallback start", { listingId: id, isAdmin });

  const statusFilter = isAdmin
    ? Prisma.empty
    : Prisma.sql`AND l."status" = 'published'`;
  const rows = await prisma.$queryRaw<
    {
      id: string;
      sellerId: string;
      title: string;
      description: string | null;
      priceCents: number;
      previousPriceCents: number | null;
      category: string;
      size: string | null;
      color: string | null;
      location: string | null;
      condition: string | null;
      shippingAvailable: boolean;
      whatsappContactAllowed: boolean;
      status: string;
      views: number;
      createdAt: Date;
      sellerEmail: string | null;
      sellerProfileDisplayName: string | null;
      sellerPhone: string | null;
      sellerLocation: string | null;
      sellerAvatarUrl: string | null;
      sellerAccountType: string | null;
      sellerVerified: boolean | null;
      sellerLastSeenAt: Date | null;
    }[]
  >`
    SELECT
      l."id"::text AS "id",
      l."sellerId"::text AS "sellerId",
      l."title",
      l."description",
      l."priceCents",
      NULL::integer AS "previousPriceCents",
      l."category",
      l."size",
      l."color",
      l."location",
      l."condition",
      l."shippingAvailable",
      l."whatsappContactAllowed",
      l."status",
      COALESCE(l."views", 0) AS "views",
      l."createdAt",
      u."email" AS "sellerEmail",
      u."avatarUrl" AS "sellerAvatarUrl",
      u."accountType" AS "sellerAccountType",
      u."verified" AS "sellerVerified",
      u."lastSeenAt" AS "sellerLastSeenAt",
      p."displayName" AS "sellerProfileDisplayName",
      p."phone" AS "sellerPhone",
      p."location" AS "sellerLocation"
    FROM "Listing" l
    LEFT JOIN "User" u ON u."id" = l."sellerId"
    LEFT JOIN "Profile" p ON p."userId" = u."id"
    WHERE l."id"::text = ${id}
    ${statusFilter}
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    logApiInfo("/api/productos/[id] fallback not found", {
      listingId: id,
      isAdmin,
    });
    return null;
  }

  const images = await prisma.listingImage.findMany({
    where: { listingId: id },
    orderBy: { sortOrder: "asc" },
    select: { url: true },
  });

  logApiInfo("/api/productos/[id] fallback found", {
    listingId: id,
    isAdmin,
    imageCount: images.length,
  });

  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    previousPriceCents: row.previousPriceCents,
    operationType: "sale",
    category: row.category,
    size: row.size,
    color: row.color,
    brand: null,
    usage: null,
    location: row.location,
    condition: row.condition,
    attributes: null,
    shippingAvailable: row.shippingAvailable,
    whatsappContactAllowed: row.whatsappContactAllowed,
    status: row.status,
    views: row.views,
    createdAt: row.createdAt,
    images,
    seller: {
      id: row.sellerId,
      username: "",
      avatarUrl: row.sellerAvatarUrl,
      accountType: row.sellerAccountType || "individual",
      verified: Boolean(row.sellerVerified),
      lastSeenAt: row.sellerLastSeenAt ? row.sellerLastSeenAt.toISOString() : null,
      displayName:
        row.sellerProfileDisplayName ||
        row.sellerEmail?.split("@")[0] ||
        "Sin perfil",
      profile:
        row.sellerPhone || row.sellerLocation
          ? {
              phone: row.sellerPhone,
              location: row.sellerLocation,
            }
          : null,
    },
    _count: {
      favorites: 0,
      conversations: 0,
    },
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      logApiInfo("/api/productos/[id] invalid id", { rawId: id });
      return res.status(400).json({ error: "ID no válido" });
    }

    const { userId, isAdmin } = await getAdminState(req);

    logApiInfo("/api/productos/[id] request", {
      listingId: id,
      userId,
      isAdmin,
      method: req.method,
    });

    let producto = null;

    try {
      producto = await prisma.listing.findFirst({
        where: {
          id,
          ...(isAdmin ? {} : { status: "published" }),
        },
        select: {
          id: true,
          sellerId: true,
          title: true,
          description: true,
          priceCents: true,
          previousPriceCents: true,
          operationType: true,
          category: true,
          size: true,
          color: true,
          brand: true,
          usage: true,
          location: true,
          condition: true,
          attributes: true,
          shippingAvailable: true,
          whatsappContactAllowed: true,
          status: true,
          views: true,
          createdAt: true,
          images: {
            orderBy: { sortOrder: "asc" },
            select: { url: true },
          },
          seller: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              accountType: true,
              verified: true,
              lastSeenAt: true,
              profile: {
                select: {
                  phone: true,
                  location: true,
                },
              },
            },
          },
          _count: {
            select: {
              favorites: true,
              conversations: true,
            },
          },
        },
      });

      logApiInfo("/api/productos/[id] prisma result", {
        listingId: id,
        userId,
        isAdmin,
        found: Boolean(producto),
        imageCount: producto?.images?.length ?? null,
      });
    } catch (error) {
      logApiError("/api/productos/[id]", error, {
        listingId: id,
        userId,
        isAdmin,
      });

      producto = await loadProductFallback(id, isAdmin);
    }

    if (!producto) {
      logApiInfo("/api/productos/[id] not found response", {
        listingId: id,
        userId,
        isAdmin,
      });
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    logApiInfo("/api/productos/[id] success", {
      listingId: id,
      userId,
      isAdmin,
      sellerId: producto.sellerId,
      imageCount: producto.images?.length ?? 0,
    });

    return res.status(200).json(producto);
  } catch (error) {
    logApiError("/api/productos/[id]", error, {
      listingId: getSingleQueryValue(req.query.id),
      userId: getSingleQueryValue(req.query.adminUserId) || null,
      isAdmin: Boolean(getSingleQueryValue(req.query.adminUserId)),
    });

    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
