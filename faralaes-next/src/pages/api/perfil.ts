import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId obligatorio" });
      }

      const profile = await prisma.profile.findUnique({
        where: { userId },
      });

      return res.status(200).json(profile);
    }

    if (req.method === "PUT") {
      const { userId, displayName, phone, location, bio } = req.body;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId obligatorio" });
      }

      if (!displayName || typeof displayName !== "string") {
        return res.status(400).json({ error: "Nombre público obligatorio" });
      }

      const profile = await prisma.profile.upsert({
        where: { userId },
        update: {
          displayName: displayName.trim(),
          phone: phone || null,
          location: location || null,
          bio: bio || null,
        },
        create: {
          userId,
          displayName: displayName.trim(),
          phone: phone || null,
          location: location || null,
          bio: bio || null,
        },
      });

      return res.status(200).json(profile);
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
