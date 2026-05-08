import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

const getLast7Days = () => {
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);

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

const countByDay = (items: { createdAt: Date }[], days: ReturnType<typeof getLast7Days>) => {
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

  const user = await requireAdmin(req, res);

  if (!user) {
    return;
  }

  const days = getLast7Days();
  const sevenDaysAgo = days[0].date;
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [
    totalListings,
    publishedListings,
    hiddenListings,
    publishedToday,
    totalUsers,
    newUsersLast7Days,
    pendingReports,
    totalFavorites,
    totalMessages,
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
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "published" } }),
    prisma.listing.count({ where: { status: "hidden" } }),
    prisma.listing.count({
      where: {
        status: "published",
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.favorite.count(),
    prisma.message.count(),
    prisma.user.count({ where: { disabled: true } }),
    prisma.listing.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { status: "published" },
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
    prisma.report.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.listing.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.listing.groupBy({
      by: ["category"],
      where: {
        status: "published",
        category: { not: "" },
      },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 5,
    }),
    prisma.listing.groupBy({
      by: ["location"],
      where: {
        status: "published",
        location: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { location: "desc" } },
      take: 5,
    }),
    prisma.favorite.groupBy({
      by: ["listingId"],
      _count: { _all: true },
      orderBy: { _count: { listingId: "desc" } },
      take: 5,
    }),
    prisma.listing.groupBy({
      by: ["sellerId"],
      where: { status: "published" },
      _count: { _all: true },
      orderBy: { _count: { sellerId: "desc" } },
      take: 5,
    }),
  ]);

  const [topFavoriteListings, topSellers, enrichedReports] = await Promise.all([
    topFavoriteGroups.length > 0
      ? prisma.listing.findMany({
          where: { id: { in: topFavoriteGroups.map((group) => group.listingId) } },
          select: { id: true, title: true, status: true },
        })
      : Promise.resolve([]),
    topSellerGroups.length > 0
      ? prisma.user.findMany({
          where: { id: { in: topSellerGroups.map((group) => group.sellerId) } },
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        })
      : Promise.resolve([]),
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
  ]);

  const favoriteListingById = new Map(
    topFavoriteListings.map((listing) => [listing.id, listing])
  );
  const sellerById = new Map(topSellers.map((seller) => [seller.id, seller]));

  return res.status(200).json({
    totals: {
      totalListings,
      publishedListings,
      hiddenListings,
      publishedToday,
      totalUsers,
      newUsersLast7Days,
      pendingReports,
      totalFavorites,
      totalMessages,
      disabledUsers,
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
}
