import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { normalizeAccountType } from "../../lib/accountTypes";
import { normalizeDisplayName } from "../../lib/userIdentity";

const normalizeAvatarUrl = (value: unknown) => {
  if (value === null || value === "") {
    return { avatarUrl: null, error: "" };
  }

  if (value === undefined) {
    return { avatarUrl: undefined, error: "" };
  }

  if (typeof value !== "string") {
    return { avatarUrl: undefined, error: "La imagen de perfil no es válida." };
  }

  const avatarUrl = value.trim();

  if (!avatarUrl) {
    return { avatarUrl: null, error: "" };
  }

  if (/^\/uploads\/avatars\/[a-z0-9._-]+\.(jpe?g|png|webp)$/i.test(avatarUrl)) {
    return { avatarUrl, error: "" };
  }

  return { avatarUrl: undefined, error: "La imagen de perfil no es válida." };
};

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
          avatarUrl: user.avatarUrl,
          accountType: user.accountType,
          verified: user.verified,
        },
      });
    }

    if (req.method === "PUT") {
      const { displayName, phone, location, bio, avatarUrl, accountType } = req.body;
      const normalizedDisplayName = normalizeDisplayName(displayName);
      const preparedAvatar = normalizeAvatarUrl(avatarUrl);
      const normalizedAccountType = normalizeAccountType(accountType);

      if (!normalizedDisplayName) {
        return res.status(400).json({ error: "Nombre público obligatorio" });
      }

      if (preparedAvatar.error) {
        return res.status(400).json({ error: preparedAvatar.error });
      }

      const [updatedUser, profile] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            displayName: normalizedDisplayName,
            accountType: normalizedAccountType,
            ...(preparedAvatar.avatarUrl !== undefined
              ? { avatarUrl: preparedAvatar.avatarUrl }
              : {}),
          },
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

      if (preparedAvatar.avatarUrl !== undefined) {
        console.log("[avatar-profile] avatarUrl guardado en User", {
          userId: updatedUser.id,
          avatarUrl: updatedUser.avatarUrl,
        });
      }

      return res.status(200).json({
        ...profile,
        displayName: normalizedDisplayName,
        avatarUrl: updatedUser.avatarUrl,
        accountType: updatedUser.accountType,
        verified: updatedUser.verified,
      });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error("[avatar-profile] error al guardar avatarUrl", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
