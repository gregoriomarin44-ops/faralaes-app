import type { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie, requireSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const DELETE_CONFIRMATION = "ELIMINAR";
const DELETED_USER_EMAIL = "usuario-eliminado@faralaes.local";
const DELETED_USERNAME = "usuario_eliminado";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await requireSessionUser(req, res);

  if (!user) {
    return;
  }

  const confirmation = (req.body as { confirmation?: unknown } | undefined)
    ?.confirmation;

  if (confirmation !== DELETE_CONFIRMATION) {
    return res.status(400).json({
      error: "Escribe ELIMINAR para confirmar la eliminacion de tu cuenta.",
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const deletedUser = await tx.user.upsert({
        where: { email: DELETED_USER_EMAIL },
        update: {
          disabled: true,
          displayName: "Usuario eliminado",
          username: DELETED_USERNAME,
          avatarUrl: null,
        },
        create: {
          email: DELETED_USER_EMAIL,
          username: DELETED_USERNAME,
          displayName: "Usuario eliminado",
          disabled: true,
          emailVerified: false,
        },
      });

      if (deletedUser.id === user.id) {
        throw new Error("No se puede eliminar el usuario tecnico.");
      }

      const ownedListings = await tx.listing.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const ownedListingIds = ownedListings.map((listing) => listing.id);

      await tx.favorite.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            ...(ownedListingIds.length > 0
              ? [{ listingId: { in: ownedListingIds } }]
              : []),
          ],
        },
      });

      await tx.report.deleteMany({
        where: { reporterUserId: user.id },
      });

      await tx.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      if (ownedListingIds.length > 0) {
        await tx.listingImage.deleteMany({
          where: { listingId: { in: ownedListingIds } },
        });

        await tx.listing.updateMany({
          where: { id: { in: ownedListingIds } },
          data: {
            sellerId: deletedUser.id,
            title: "Anuncio eliminado",
            description: null,
            priceCents: 0,
            category: "eliminado",
            size: null,
            color: null,
            brand: null,
            usage: null,
            location: null,
            condition: null,
            status: "deleted",
            shippingAvailable: false,
            whatsappContactAllowed: false,
          },
        });
      }

      await tx.message.updateMany({
        where: { senderId: user.id },
        data: {
          senderId: deletedUser.id,
          body: "Mensaje de usuario eliminado",
        },
      });

      await tx.conversation.updateMany({
        where: { buyerId: user.id },
        data: { buyerId: deletedUser.id },
      });

      await tx.conversation.updateMany({
        where: { sellerId: user.id },
        data: { sellerId: deletedUser.id },
      });

      await tx.profile.deleteMany({
        where: { userId: user.id },
      });

      await tx.user.delete({
        where: { id: user.id },
      });
    });

    clearSessionCookie(res);
    return res.status(200).json({
      message: "Tu cuenta ha sido eliminada correctamente.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "No se ha podido eliminar la cuenta." });
  }
}
