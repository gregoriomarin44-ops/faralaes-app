import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
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

const safeDashboardQuery = async <T,>(
  label: string,
  query: Promise<T>,
  fallback: T,
  context: Record<string, unknown>
) => {
  try {
    return await query;
  } catch (error) {
    logApiError(`/api/admin/dashboard ${label}`, error, context);
    return fallback;
  }
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

const allowedRanges = [7, 30, 90] as const;
type DashboardRange = (typeof allowedRanges)[number];

const getRange = (value: unknown): DashboardRange => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const range = Number(rawValue);

  return allowedRanges.includes(range as DashboardRange)
    ? (range as DashboardRange)
    : 7;
};

const getDays = (range: DashboardRange) => {
  const today = startOfDay(new Date());

  return Array.from({ length: range }, (_, index) => {
    const date = addDays(today, index - (range - 1));

    return {
      date,
      key: getDayKey(date),
      label: new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
      }).format(date),
    };
  });
};

const countByDay = (items: { createdAt: Date }[], days: ReturnType<typeof getDays>) => {
  const counts = new Map(days.map((day) => [day.key, 0]));

  items.forEach((item) => {
    const key = getDayKey(startOfDay(item.createdAt));
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return days.map((day) => ({
    label: day.label,
    value: counts.get(day.key) || 0,
  }));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const queryParamsRecibidos = req.query;
  const range = getRange(req.query.range);
  const filtrosRecibidos = { range };

  try {
    const user = await requireAdmin(req, res);

    if (!user) {
      return;
    }

    const days = getDays(range);
    const rangeStart = days[0].date;
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const logContext = {
      filtrosRecibidos,
      queryParamsRecibidos,
      rangeStart,
      today,
      tomorrow,
    };

    const [
    totalListings,
    publishedListings,
    hiddenListings,
    hiddenListingsInRange,
    publishedToday,
    publishedListingsInRange,
    totalUsers,
    newUsersInRange,
    pendingReports,
    pendingReportsInRange,
    createdReportsInRange,
    totalFavorites,
    favoritesInRange,
    totalMessages,
    messagesInRange,
    disabledUsers,
    latestListings,
    latestUsers,
    latestReports,
    recentListingsForChart,
    recentUsersForChart,
    topCategories,
    topLocations,
    topFavoriteGroups,
    topSellerGroups,
  ] = await Promise.all([
    safeDashboardQuery("totalListings", prisma.listing.count(), 0, logContext),
    safeDashboardQuery(
      "publishedListings",
      prisma.listing.count({ where: { status: "published" } }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "hiddenListings",
      prisma.listing.count({ where: { status: "hidden" } }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "hiddenListingsInRange",
      prisma.listing.count({
        where: { status: "hidden", updatedAt: { gte: rangeStart } },
      }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "publishedToday",
      prisma.listing.count({
        where: {
          status: "published",
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "publishedListingsInRange",
      prisma.listing.count({
        where: { status: "published", createdAt: { gte: rangeStart } },
      }),
      0,
      logContext
    ),
    safeDashboardQuery("totalUsers", prisma.user.count(), 0, logContext),
    safeDashboardQuery(
      "newUsersInRange",
      prisma.user.count({ where: { createdAt: { gte: rangeStart } } }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "pendingReports",
      prisma.report.count({ where: { status: "pending" } }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "pendingReportsInRange",
      prisma.report.count({
        where: { status: "pending", createdAt: { gte: rangeStart } },
      }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "createdReportsInRange",
      prisma.report.count({ where: { createdAt: { gte: rangeStart } } }),
      0,
      logContext
    ),
    safeDashboardQuery("totalFavorites", prisma.favorite.count(), 0, logContext),
    safeDashboardQuery(
      "favoritesInRange",
      prisma.favorite.count({ where: { createdAt: { gte: rangeStart } } }),
      0,
      logContext
    ),
    safeDashboardQuery("totalMessages", prisma.message.count(), 0, logContext),
    safeDashboardQuery(
      "messagesInRange",
      prisma.message.count({ where: { createdAt: { gte: rangeStart } } }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "disabledUsers",
      prisma.user.count({ where: { disabled: true } }),
      0,
      logContext
    ),
    safeDashboardQuery(
      "latestListings",
      prisma.listing.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { status: "published", createdAt: { gte: rangeStart } },
      select: {
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
      },
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "latestUsers",
      prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: rangeStart } },
      include: {
        profile: true,
      },
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "latestReports",
      prisma.report.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: rangeStart } },
      include: {
        reporter: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "recentListingsForChart",
      prisma.listing.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "recentUsersForChart",
      prisma.user.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "topCategories",
      prisma.listing.groupBy({
      by: ["category"],
      where: {
        status: "published",
        category: { not: "" },
        createdAt: { gte: rangeStart },
      },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 5,
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "topLocations",
      prisma.listing.groupBy({
      by: ["location"],
      where: {
        status: "published",
        location: { not: null },
        createdAt: { gte: rangeStart },
      },
      _count: { _all: true },
      orderBy: { _count: { location: "desc" } },
      take: 5,
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "topFavoriteGroups",
      prisma.favorite.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: rangeStart } },
      _count: { _all: true },
      orderBy: { _count: { listingId: "desc" } },
      take: 5,
    }),
      [],
      logContext
    ),
    safeDashboardQuery(
      "topSellerGroups",
      prisma.listing.groupBy({
      by: ["sellerId"],
      where: { status: "published", createdAt: { gte: rangeStart } },
      _count: { _all: true },
      orderBy: { _count: { sellerId: "desc" } },
      take: 5,
    }),
      [],
      logContext
    ),
  ]);

  const [topFavoriteListings, topSellers, enrichedReports] = await Promise.all([
    topFavoriteGroups.length > 0
      ? safeDashboardQuery(
          "topFavoriteListings",
          prisma.listing.findMany({
          where: { id: { in: topFavoriteGroups.map((group) => group.listingId) } },
          select: { id: true, title: true, status: true },
        }),
          [],
          logContext
        )
      : Promise.resolve([]),
    topSellerGroups.length > 0
      ? safeDashboardQuery(
          "topSellers",
          prisma.user.findMany({
          where: { id: { in: topSellerGroups.map((group) => group.sellerId) } },
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        }),
          [],
          logContext
        )
      : Promise.resolve([]),
    safeDashboardQuery(
      "enrichedReports",
      Promise.all(
        latestReports.map(async (report) => {
          if (report.targetType === "listing") {
            const target = await prisma.listing.findUnique({
              where: { id: report.targetId },
              select: { title: true, status: true },
            });

            return { ...report, target };
          }

          const target = await prisma.user.findUnique({
            where: { id: report.targetId },
            select: { username: true, displayName: true, disabled: true },
          });

          return { ...report, target };
        })
      ),
      [],
      logContext
    ),
  ]);

  const favoriteListingById = new Map(
    topFavoriteListings.map((listing) => [listing.id, listing])
  );
  const sellerById = new Map(topSellers.map((seller) => [seller.id, seller]));

  return res.status(200).json({
    range,
    totals: {
      totalListings,
      publishedListings,
      hiddenListings,
      totalUsers,
      pendingReports,
      totalFavorites,
      totalMessages,
      disabledUsers,
    },
    period: {
      publishedListings: publishedListingsInRange,
      hiddenListings: hiddenListingsInRange,
      publishedToday,
      newUsers: newUsersInRange,
      pendingReports: pendingReportsInRange,
      createdReports: createdReportsInRange,
      favorites: favoritesInRange,
      messages: messagesInRange,
    },
    latestListings,
    latestUsers,
    latestReports: enrichedReports,
    charts: {
      listingsByDay: countByDay(recentListingsForChart, days),
      usersByDay: countByDay(recentUsersForChart, days),
    },
    marketplace: {
      topCategories: topCategories.map((category) => ({
        label: category.category || "Sin categoria",
        value: category._count._all,
      })),
      topLocations: topLocations.map((location) => ({
        label: location.location || "Sin ubicacion",
        value: location._count._all,
      })),
      topFavoriteListings: topFavoriteGroups.map((group) => {
        const listing = favoriteListingById.get(group.listingId);

        return {
          id: group.listingId,
          label: listing?.title || "Anuncio eliminado",
          status: listing?.status || "no disponible",
          value: group._count._all,
        };
      }),
      topSellers: topSellerGroups.map((group) => {
        const seller = sellerById.get(group.sellerId);

        return {
          id: group.sellerId,
          label: seller?.displayName || seller?.username || "Usuario eliminado",
          value: group._count._all,
        };
      }),
    },
  });
  } catch (error) {
    logApiError("/api/admin/dashboard", error, {
      filtrosRecibidos,
      queryParamsRecibidos,
    });

    return res.status(500).json({
      error: "No se han podido cargar los datos del panel.",
    });
  }
}
