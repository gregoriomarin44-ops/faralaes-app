import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { isReportStatus, isUuid } from "../../../../lib/reports";

const allowedActions = ["hide_listing", "publish_listing", "disable_user"] as const;
type ModerationAction = (typeof allowedActions)[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const { id } = req.query;

  if (!isUuid(id)) {
    return res.status(400).json({ error: "Reporte no valido." });
  }

  const { status, action } = req.body as {
    status?: unknown;
    action?: unknown;
  };

  const report = await prisma.report.findUnique({ where: { id } });

  if (!report) {
    return res.status(404).json({ error: "Reporte no encontrado." });
  }

  if (isReportStatus(status)) {
    const updated = await prisma.report.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json(updated);
  }

  if (
    typeof action !== "string" ||
    !allowedActions.includes(action as ModerationAction)
  ) {
    return res.status(400).json({ error: "Accion no valida." });
  }

  if (action === "hide_listing") {
    if (report.targetType !== "listing") {
      return res.status(400).json({ error: "El reporte no apunta a un anuncio." });
    }

    await prisma.listing.update({
      where: { id: report.targetId },
      data: { status: "hidden" },
    });
  }

  if (action === "publish_listing") {
    if (report.targetType !== "listing") {
      return res.status(400).json({ error: "El reporte no apunta a un anuncio." });
    }

    await prisma.listing.update({
      where: { id: report.targetId },
      data: { status: "published" },
    });
  }

  if (action === "disable_user") {
    if (report.targetType !== "user") {
      return res.status(400).json({ error: "El reporte no apunta a un usuario." });
    }

    if (report.targetId === admin.id) {
      return res
        .status(400)
        .json({ error: "No puedes desactivar tu propia cuenta." });
    }

    await prisma.user.update({
      where: { id: report.targetId },
      data: { disabled: true },
    });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: "resolved" },
  });

  return res.status(200).json(updated);
}
