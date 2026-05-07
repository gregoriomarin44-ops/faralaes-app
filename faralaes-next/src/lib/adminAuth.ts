import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "./auth";
import { prisma } from "./prisma";

export type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

const getRequestUserId = (req: NextApiRequest) => {
  const queryUserId = req.query.userId;

  if (typeof queryUserId === "string") {
    return queryUserId;
  }

  if (Array.isArray(queryUserId)) {
    return queryUserId[0] || null;
  }

  const bodyUserId = (req.body as { userId?: unknown } | undefined)?.userId;

  return typeof bodyUserId === "string" ? bodyUserId : null;
};

export async function getAdminUser(userId: unknown) {
  if (!userId || typeof userId !== "string") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AdminUser | null> {
  const sessionUser = await getSessionUser(req);
  const user = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
      }
    : await getAdminUser(getRequestUserId(req));

  if (!user) {
    res.status(401).json({ error: "No has iniciado sesion." });
    return null;
  }

  if (user.role !== "ADMIN") {
    res.status(403).json({ error: "Acceso denegado." });
    return null;
  }

  return user;
}
