import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      const { conversationId, senderId, body } = req.body;

      if (!conversationId || !senderId || !body) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          body,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json(message);
    }

    if (req.method === "GET") {
      const { conversationId } = req.query;

      if (!conversationId || typeof conversationId !== "string") {
        return res.status(400).json({ error: "conversationId obligatorio" });
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
