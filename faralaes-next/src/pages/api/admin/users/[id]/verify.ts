import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logVerifyUserError = (
  error: unknown,
  context: {
    adminUserId: string | null;
    targetUserId: string | null;
  }
) => {
  console.error("[/api/admin/users/[id]/verify] Error", {
    endpoint: "/api/admin/users/[id]/verify",
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

    await prisma.user.update({
      where: { id: targetUserId },
      data: { emailVerified: true },
      select: { id: true },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    logVerifyUserError(error, {
      adminUserId,
      targetUserId,
    });

    return res.status(500).json({
      error: "No se ha podido verificar el usuario.",
    });
  }
}
