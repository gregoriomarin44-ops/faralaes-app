import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";

const TEMPORARY_PASSWORD = "Faralaes123!";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logResetPasswordError = (
  error: unknown,
  context: {
    adminUserId: string | null;
    targetUserId: string | null;
  }
) => {
  console.error("[/api/admin/users/[id]/reset-password] Error", {
    endpoint: "/api/admin/users/[id]/reset-password",
    adminUserId: context.adminUserId,
    targetUserId: context.targetUserId,
    message: getErrorMessage(error),
    stack: getErrorStack(error),
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  let adminUserId: string | null = null;
  const targetUserId = Array.isArray(req.query.id)
    ? req.query.id[0] || null
    : req.query.id || null;

  try {
    const admin = await requireAdmin(req, res);

    if (!admin) {
      return;
    }

    adminUserId = admin.id;

    if (!targetUserId) {
      return res.status(400).json({ error: "Usuario no valido" });
    }

    const passwordHash = await bcrypt.hash(TEMPORARY_PASSWORD, 12);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
      select: { id: true },
    });

    return res.status(200).json({
      message: "Contraseña reseteada correctamente.",
      temporaryPassword: TEMPORARY_PASSWORD,
    });
  } catch (error) {
    logResetPasswordError(error, {
      adminUserId,
      targetUserId,
    });

    return res.status(500).json({
      error: "No se ha podido resetear la contraseña.",
    });
  }
}
