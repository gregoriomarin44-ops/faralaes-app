import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";
import { normalizeAccountType } from "../../../lib/accountTypes";

const allowedRoles = ["USER", "ADMIN"] as const;
type UserRole = (typeof allowedRoles)[number];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStack = (error: unknown) =>
  error instanceof Error ? error.stack : undefined;

const logUserDisabledChange = (
  error: unknown,
  context: {
    adminUserId: string;
    targetUserId: string;
    disabledBefore: boolean | null;
    disabledAfter: boolean | null;
  }
) => {
  console.error("[/api/admin/users] Error", {
    endpoint: "/api/admin/users",
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

  if (req.method === "GET") {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
      },
    });

    return res.status(200).json(users);
  }

  if (req.method === "PATCH") {
    const { targetUserId, role, disabled, verified, accountType } = req.body as {
      targetUserId?: unknown;
      role?: unknown;
      disabled?: unknown;
      verified?: unknown;
      accountType?: unknown;
    };

    if (typeof targetUserId !== "string") {
      return res.status(400).json({ error: "Usuario no valido" });
    }

    if (typeof disabled === "boolean") {
      if (targetUserId === admin.id && disabled) {
        return res
          .status(400)
          .json({ error: "No puedes desactivar tu propia cuenta." });
      }

      let disabledBefore: boolean | null = null;

      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { disabled: true },
        });

        if (!currentUser) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }

        disabledBefore = currentUser.disabled;

        const user = await prisma.user.update({
          where: { id: targetUserId },
          data: { disabled },
          include: {
            profile: true,
          },
        });

        console.info("[/api/admin/users] Disabled change", {
          endpoint: "/api/admin/users",
          adminUserId: admin.id,
          targetUserId,
          disabledAntes: disabledBefore,
          disabledDespues: user.disabled,
        });

        return res.status(200).json(user);
      } catch (error) {
        logUserDisabledChange(error, {
          adminUserId: admin.id,
          targetUserId,
          disabledBefore,
          disabledAfter: disabled,
        });

        return res
          .status(500)
          .json({ error: "No se ha podido cambiar el estado del usuario." });
      }
    }

    if (typeof verified === "boolean") {
      if (targetUserId === admin.id && verified) {
        return res
          .status(400)
          .json({ error: "No puedes verificar tu propia cuenta de vendedor." });
      }

      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: { verified },
        include: {
          profile: true,
        },
      });

      return res.status(200).json(user);
    }

    if (typeof accountType === "string") {
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: { accountType: normalizeAccountType(accountType) },
        include: {
          profile: true,
        },
      });

      return res.status(200).json(user);
    }

    if (typeof role !== "string" || !allowedRoles.includes(role as UserRole)) {
      return res.status(400).json({ error: "Rol no valido" });
    }

    if (targetUserId === admin.id && role !== "ADMIN") {
      return res
        .status(400)
        .json({ error: "No puedes quitarte tu propio rol de administrador." });
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as UserRole },
      include: {
        profile: true,
      },
    });

    return res.status(200).json(user);
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Metodo no permitido" });
}
