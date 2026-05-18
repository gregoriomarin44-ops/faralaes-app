import type { NextApiRequest, NextApiResponse } from "next";
import { requireVerifiedSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await requireVerifiedSessionUser(req, res);

  if (!user) {
    return;
  }

  const count = await prisma.message.count({
    where: {
      receiverId: user.id,
      readAt: null,
    },
  });

  return res.status(200).json({ count });
}
