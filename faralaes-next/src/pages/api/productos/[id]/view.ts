import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|preview|slurp|bing|duckduck|facebookexternalhit|whatsapp|telegram|linkedin|embedly|quora|pinterest|monitoring/i;
const VIEW_THROTTLE_MS = 6 * 60 * 60 * 1000;
const ipViewThrottle = new Map<string, number>();

const getSingleQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getClientIp = (req: NextApiRequest) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return (
    firstForwarded?.trim() ||
    req.socket.remoteAddress ||
    req.headers["x-real-ip"]?.toString() ||
    ""
  );
};

const getViewCookieName = (listingId: string) =>
  `faralaes_view_${listingId.replace(/[^a-zA-Z0-9]/g, "")}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const id = getSingleQueryValue(req.query.id);

  if (!id) {
    return res.status(400).json({ error: "ID no valido" });
  }

  const userAgent = req.headers["user-agent"] || "";

  if (!userAgent || BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return res.status(200).json({ counted: false, reason: "bot" });
  }

  try {
    const viewCookieName = getViewCookieName(id);

    if (req.cookies[viewCookieName]) {
      return res.status(200).json({ counted: false, reason: "throttled" });
    }

    const ipThrottleKey = `${id}:${getClientIp(req)}`;
    const lastIpViewAt = ipViewThrottle.get(ipThrottleKey) || 0;

    if (lastIpViewAt && Date.now() - lastIpViewAt < VIEW_THROTTLE_MS) {
      return res.status(200).json({ counted: false, reason: "throttled" });
    }

    const currentUser = await getSessionUser(req).catch(() => null);
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        sellerId: true,
        status: true,
        views: true,
      },
    });

    if (!listing || listing.status !== "published") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (currentUser?.role === "ADMIN") {
      return res.status(200).json({ counted: false, reason: "admin" });
    }

    if (currentUser?.id === listing.sellerId) {
      return res.status(200).json({ counted: false, reason: "owner" });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });
    res.setHeader(
      "Set-Cookie",
      `${viewCookieName}=1; Path=/; Max-Age=21600; SameSite=Lax`
    );
    ipViewThrottle.set(ipThrottleKey, Date.now());

    console.log("[listing-view] counted", {
      listingId: id,
      userId: currentUser?.id || null,
    });

    return res.status(200).json({ counted: true, views: updated.views });
  } catch (error) {
    console.error("[listing-view] error", {
      listingId: id,
      error,
    });

    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
