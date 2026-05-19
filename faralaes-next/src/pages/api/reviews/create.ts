import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { touchUserLastSeen } from "../../../lib/serverUserActivity";

const MAX_COMMENT_LENGTH = 600;
const MIN_REVIEW_INTERVAL_MS = 30_000;

const sanitizeComment = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_COMMENT_LENGTH);

  return normalized || null;
};

const getConversationBetweenUsers = async (
  reviewerId: string,
  reviewedUserId: string,
  conversationId: unknown
) => {
  const conversationWhere =
    typeof conversationId === "string" && conversationId.trim()
      ? { id: conversationId.trim() }
      : {};

  return prisma.conversation.findFirst({
    where: {
      ...conversationWhere,
      OR: [
        { buyerId: reviewerId, sellerId: reviewedUserId },
        { buyerId: reviewedUserId, sellerId: reviewerId },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const user = await requireSessionUser(req, res);

    if (!user) {
      return;
    }

    const { reviewedUserId, conversationId, rating, comment } = req.body;
    const normalizedRating = Number(rating);

    if (!reviewedUserId || typeof reviewedUserId !== "string") {
      return res.status(400).json({ error: "Usuario valorado no válido." });
    }

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ error: "La valoración debe estar entre 1 y 5." });
    }

    if (reviewedUserId === user.id) {
      return res.status(400).json({ error: "No puedes valorarte a ti mismo." });
    }

    const reviewedUser = await prisma.user.findFirst({
      where: { id: reviewedUserId, disabled: false },
      select: { id: true },
    });

    if (!reviewedUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const conversation = await getConversationBetweenUsers(
      user.id,
      reviewedUserId,
      conversationId
    );

    if (!conversation) {
      return res.status(403).json({
        error: "Sólo puedes valorar a usuarios con los que ya tienes conversación.",
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedUserId: {
          reviewerId: user.id,
          reviewedUserId,
        },
      },
      select: { id: true },
    });

    if (existingReview) {
      return res.status(409).json({
        error: "Ya has valorado a este usuario.",
      });
    }

    const latestReview = await prisma.review.findFirst({
      where: { reviewerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (
      latestReview &&
      Date.now() - latestReview.createdAt.getTime() < MIN_REVIEW_INTERVAL_MS
    ) {
      return res.status(429).json({
        error: "Espera unos segundos antes de publicar otra valoración.",
      });
    }

    const review = await prisma.review.create({
      data: {
        rating: normalizedRating,
        comment: sanitizeComment(comment),
        reviewerId: user.id,
        reviewedUserId,
        conversationId: conversation.id,
      },
      include: {
        reviewer: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
    await touchUserLastSeen(user.id, user.lastSeenAt, { force: true }).catch(
      () => null
    );

    return res.status(201).json(review);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "Ya has valorado a este usuario.",
      });
    }

    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
