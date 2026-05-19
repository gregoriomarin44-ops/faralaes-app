import { prisma } from "./prisma";

const LAST_SEEN_THROTTLE_MS = 10 * 60 * 1000;

export const shouldTouchLastSeen = (lastSeenAt?: Date | string | null) => {
  if (!lastSeenAt) {
    return true;
  }

  const timestamp =
    lastSeenAt instanceof Date ? lastSeenAt.getTime() : new Date(lastSeenAt).getTime();

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > LAST_SEEN_THROTTLE_MS;
};

export const touchUserLastSeen = async (
  userId: string,
  lastSeenAt?: Date | string | null,
  options: { force?: boolean } = {}
) => {
  if (!options.force && !shouldTouchLastSeen(lastSeenAt)) {
    return null;
  }

  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: now },
  });

  return now;
};

export const getRecentResponderIds = async (userIds: string[]) => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Set<string>();
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.message.groupBy({
    by: ["senderId"],
    where: {
      senderId: { in: uniqueIds },
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });

  return new Set(rows.filter((row) => row._count._all > 0).map((row) => row.senderId));
};
