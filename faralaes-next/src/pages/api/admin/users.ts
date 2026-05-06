import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

const allowedRoles = ["USER", "ADMIN"] as const;
type UserRole = (typeof allowedRoles)[number];

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
    const { targetUserId, role } = req.body as {
      targetUserId?: unknown;
      role?: unknown;
    };

    if (typeof targetUserId !== "string") {
      return res.status(400).json({ error: "Usuario no valido" });
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
