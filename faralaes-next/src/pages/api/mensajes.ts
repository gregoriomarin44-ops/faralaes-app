import type { NextApiRequest, NextApiResponse } from "next";
import { requireVerifiedSessionUser } from "../../lib/auth";
import { sendMessageNotificationEmail } from "../../lib/messageNotifications";
import { prisma } from "../../lib/prisma";
import { touchUserLastSeen } from "../../lib/serverUserActivity";

const getErrorLogDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return { message: String(error) };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireVerifiedSessionUser(req, res);

    if (!user) {
      return;
    }

    if (req.method === "POST") {
      const { conversationId, body } = req.body;

      if (!conversationId || !body) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
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

      const receiverId =
        conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          receiverId,
          body,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      await touchUserLastSeen(user.id, user.lastSeenAt, { force: true }).catch(
        () => null
      );

      try {
        await sendMessageNotificationEmail({
          conversationId: conversation.id,
          senderId: user.id,
          receiverId,
          body,
          req,
        });
      } catch (error) {
        console.error("[message-email] failed", {
          conversationId: conversation.id,
          senderId: user.id,
          receiverId,
          error: getErrorLogDetails(error),
        });
      }

      return res.status(201).json(message);
    }

    if (req.method === "GET") {
      const { conversationId } = req.query;

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

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });

      return res.status(200).json(messages);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
