import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  isReportReason,
  isReportTargetType,
  isUuid,
  sanitizeReportText,
} from "../../lib/reports";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_PER_WINDOW = 3;
const recentReports = new Map<string, number[]>();

const isRateLimited = (key: string) => {
  const now = Date.now();
  const recent = (recentReports.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX_PER_WINDOW) {
    recentReports.set(key, recent);
    return true;
  }

  recent.push(now);
  recentReports.set(key, recent);
  return false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const reporter = await requireSessionUser(req, res);

  if (!reporter) {
    return;
  }

  const { targetType, targetId, reason } = req.body as {
    targetType?: unknown;
    targetId?: unknown;
    reason?: unknown;
  };

  if (!isReportTargetType(targetType)) {
    return res.status(400).json({ error: "Tipo de reporte no valido." });
  }

  if (!isUuid(targetId)) {
    return res.status(400).json({ error: "Objetivo no valido." });
  }

  if (!isReportReason(reason)) {
    return res.status(400).json({ error: "Motivo no valido." });
  }

  const details = sanitizeReportText(req.body?.details, 1000);
  const rateLimitKey = `${reporter.id}:${targetType}:${targetId}`;

  if (isRateLimited(rateLimitKey)) {
    return res
      .status(429)
      .json({ error: "Has enviado demasiados reportes en poco tiempo." });
  }

  const since = new Date(Date.now() - 10 * 60 * 1000);
  const recentCount = await prisma.report.count({
    where: {
      reporterUserId: reporter.id,
      targetType,
      targetId,
      createdAt: { gte: since },
    },
  });

  if (recentCount >= 3) {
    return res
      .status(429)
      .json({ error: "Has enviado demasiados reportes para este objetivo." });
  }

  if (targetType === "listing") {
    const listing = await prisma.listing.findUnique({
      where: { id: targetId },
      select: { sellerId: true },
    });

    if (!listing) {
      return res.status(404).json({ error: "Anuncio no encontrado." });
    }

    if (listing.sellerId === reporter.id) {
      return res.status(400).json({ error: "No puedes reportar tu propio anuncio." });
    }
  }

  if (targetType === "user") {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (targetUser.id === reporter.id) {
      return res.status(400).json({ error: "No puedes reportarte a ti mismo." });
    }
  }

  const report = await prisma.report.create({
    data: {
      reporterUserId: reporter.id,
      targetType,
      targetId,
      reason,
      details: details || null,
    },
  });

  return res.status(201).json(report);
}
