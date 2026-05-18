import type { NextApiRequest, NextApiResponse } from "next";
import { requireVerifiedSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await requireVerifiedSessionUser(req, res);

  if (!user) {
    return;
  }

  const { conversationId } = req.body;

  if (!conversationId || typeof conversationId !== "string") {
    return res.status(400).json({ error: "conversationId obligatorio" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      sellerId: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({ error: "Conversación no encontrada" });
  }

  if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const readAt = new Date();
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: user.id,
      readAt: null,
    },
    data: {
      readAt,
    },
  });

  const unreadCount = await prisma.message.count({
    where: {
      receiverId: user.id,
      readAt: null,
    },
  });

  return res.status(200).json({
    updated: result.count,
    readAt: readAt.toISOString(),
    unreadCount,
  });
}
