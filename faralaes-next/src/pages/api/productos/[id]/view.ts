import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|preview|slurp|bing|duckduck|facebookexternalhit|whatsapp|telegram|linkedin|embedly|quora|pinterest|monitoring/i;
const VIEW_THROTTLE_MS = 6 * 60 * 60 * 1000;
const ANONYMOUS_VIEW_COOKIE = "faralaes_view_session";
const ANONYMOUS_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const getSingleQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const serializeAnonymousCookie = (anonymousId: string) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${ANONYMOUS_VIEW_COOKIE}=${anonymousId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ANONYMOUS_VIEW_COOKIE_MAX_AGE}${secure}`;
};

const logListingView = (
  message:
    | "counted"
    | "skipped owner"
    | "skipped admin"
    | "skipped throttle user"
    | "skipped throttle anonymous",
  context: Record<string, unknown>
) => {
  console.log(`[listing-view] ${message}`, context);
};

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
    const now = new Date();
    const throttleThreshold = new Date(now.getTime() - VIEW_THROTTLE_MS);
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
      logListingView("skipped admin", {
        listingId: id,
        userId: currentUser.id,
      });
      return res.status(200).json({ counted: false, reason: "admin" });
    }

    if (currentUser?.id === listing.sellerId) {
      logListingView("skipped owner", {
        listingId: id,
        userId: currentUser.id,
      });
      return res.status(200).json({ counted: false, reason: "owner" });
    }

    if (currentUser) {
      const previousView = await prisma.listingView.findUnique({
        where: {
          listingId_userId: {
            listingId: id,
            userId: currentUser.id,
          },
        },
        select: { lastViewedAt: true },
      });

      if (previousView && previousView.lastViewedAt > throttleThreshold) {
        logListingView("skipped throttle user", {
          listingId: id,
          userId: currentUser.id,
          lastViewedAt: previousView.lastViewedAt.toISOString(),
        });
        return res.status(200).json({
          counted: false,
          reason: "throttle-user",
          views: listing.views,
        });
      }

      const [updated] = await prisma.$transaction([
        prisma.listing.update({
          where: { id },
          data: { views: { increment: 1 } },
          select: { views: true },
        }),
        prisma.listingView.upsert({
          where: {
            listingId_userId: {
              listingId: id,
              userId: currentUser.id,
            },
          },
          update: { lastViewedAt: now },
          create: {
            listingId: id,
            userId: currentUser.id,
            lastViewedAt: now,
          },
        }),
      ]);

      logListingView("counted", {
        listingId: id,
        userId: currentUser.id,
        identity: "user",
      });
      return res.status(200).json({ counted: true, views: updated.views });
    }

    const anonymousId = req.cookies[ANONYMOUS_VIEW_COOKIE] || randomUUID();

    res.setHeader("Set-Cookie", serializeAnonymousCookie(anonymousId));

    const previousAnonymousView = await prisma.listingView.findUnique({
      where: {
        listingId_anonymousId: {
          listingId: id,
          anonymousId,
        },
      },
      select: { lastViewedAt: true },
    });

    if (
      previousAnonymousView &&
      previousAnonymousView.lastViewedAt > throttleThreshold
    ) {
      logListingView("skipped throttle anonymous", {
        listingId: id,
        anonymousId,
        lastViewedAt: previousAnonymousView.lastViewedAt.toISOString(),
      });
      return res.status(200).json({
        counted: false,
        reason: "throttle-anonymous",
        views: listing.views,
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.listing.update({
        where: { id },
        data: { views: { increment: 1 } },
        select: { views: true },
      }),
      prisma.listingView.upsert({
        where: {
          listingId_anonymousId: {
            listingId: id,
            anonymousId,
          },
        },
        update: { lastViewedAt: now },
        create: {
          listingId: id,
          anonymousId,
          lastViewedAt: now,
        },
      }),
    ]);

    logListingView("counted", {
      listingId: id,
      anonymousId,
      identity: "anonymous",
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
