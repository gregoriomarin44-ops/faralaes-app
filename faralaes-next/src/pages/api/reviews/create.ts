import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

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

    const { reviewedUserId, listingId, rating, comment } = req.body;
    const normalizedRating = Number(rating);
    const normalizedListingId =
      typeof listingId === "string" && listingId.trim() ? listingId : null;

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

    if (normalizedListingId) {
      const listing = await prisma.listing.findFirst({
        where: {
          id: normalizedListingId,
          sellerId: reviewedUserId,
          status: "published",
        },
        select: { id: true },
      });

      if (!listing) {
        return res.status(400).json({
          error: "El anuncio no pertenece al usuario valorado.",
        });
      }
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: user.id,
        reviewedUserId,
        listingId: normalizedListingId,
      },
      select: { id: true },
    });

    if (existingReview) {
      return res.status(409).json({
        error: "Ya has valorado a este vendedor para este anuncio.",
      });
    }

    const review = await prisma.review.create({
      data: {
        rating: normalizedRating,
        comment:
          typeof comment === "string" && comment.trim()
            ? comment.trim().slice(0, 600)
            : null,
        reviewerId: user.id,
        reviewedUserId,
        listingId: normalizedListingId,
      },
      include: {
        reviewer: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    return res.status(201).json(review);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "Ya has valorado a este vendedor para este anuncio.",
      });
    }

    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
