import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { normalizeDisplayName } from "../../lib/userIdentity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireSessionUser(req, res);

    if (!user) {
      return;
    }

    if (req.method === "GET") {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      return res.status(200).json({
        profile,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
        },
      });
    }

    if (req.method === "PUT") {
      const { displayName, phone, location, bio } = req.body;
      const normalizedDisplayName = normalizeDisplayName(displayName);

      if (!normalizedDisplayName) {
        return res.status(400).json({ error: "Nombre público obligatorio" });
      }

      const [, profile] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { displayName: normalizedDisplayName },
        }),
        prisma.profile.upsert({
          where: { userId: user.id },
          update: {
            displayName: normalizedDisplayName,
            phone: phone || null,
            location: location || null,
            bio: bio || null,
          },
          create: {
            userId: user.id,
            displayName: normalizedDisplayName,
            phone: phone || null,
            location: location || null,
            bio: bio || null,
          },
        }),
      ]);

      return res.status(200).json({
        ...profile,
        displayName: normalizedDisplayName,
      });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
