import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { isProfileComplete } from "../../lib/profileCompleteness";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await getSessionUser(req);

  if (!user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      displayName: true,
      phone: true,
      location: true,
      bio: true,
    },
  });

  return res.status(200).json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    profile,
    profileComplete: isProfileComplete(profile),
  });
}
