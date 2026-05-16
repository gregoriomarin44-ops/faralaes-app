import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { isReportStatus, isUuid } from "../../../../lib/reports";

const allowedActions = [
  "hide_listing",
  "publish_listing",
  "disable_user",
  "enable_user",
] as const;
type ModerationAction = (typeof allowedActions)[number];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logReportDisabledChange = (
  error: unknown,
  context: {
    adminUserId: string;
    targetUserId: string;
    disabledBefore: boolean | null;
    disabledAfter: boolean | null;
  }
) => {
  console.error("[/api/admin/reports/[id]] Error", {
    endpoint: "/api/admin/reports/[id]",
    adminUserId: context.adminUserId,
    targetUserId: context.targetUserId,
    disabledAntes: context.disabledBefore,
    disabledDespues: context.disabledAfter,
    message: getErrorMessage(error),
    stack: getErrorStack(error),
  });
};

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

  if (action === "disable_user" || action === "enable_user") {
    if (report.targetType !== "user") {
      return res.status(400).json({ error: "El reporte no apunta a un usuario." });
    }

    const disabledAfter = action === "disable_user";

    if (report.targetId === admin.id && disabledAfter) {
      return res
        .status(400)
        .json({ error: "No puedes desactivar tu propia cuenta." });
    }

    let disabledBefore: boolean | null = null;

    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: report.targetId },
        select: { disabled: true },
      });

      if (!currentUser) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      disabledBefore = currentUser.disabled;

      const updatedUser = await prisma.user.update({
        where: { id: report.targetId },
        data: { disabled: disabledAfter },
        select: { disabled: true },
      });

      console.info("[/api/admin/reports/[id]] Disabled change", {
        endpoint: "/api/admin/reports/[id]",
        adminUserId: admin.id,
        targetUserId: report.targetId,
        disabledAntes: disabledBefore,
        disabledDespues: updatedUser.disabled,
      });
    } catch (error) {
      logReportDisabledChange(error, {
        adminUserId: admin.id,
        targetUserId: report.targetId,
        disabledBefore,
        disabledAfter,
      });

      return res
        .status(500)
        .json({ error: "No se ha podido cambiar el estado del usuario." });
    }
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: "resolved" },
  });

  return res.status(200).json(updated);
}
