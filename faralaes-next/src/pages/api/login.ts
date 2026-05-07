import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "../../lib/auth";
import {
  getAppBaseUrl,
  sendUserVerificationEmail,
} from "../../lib/emailVerification";
import { prisma } from "../../lib/prisma";
import {
  normalizeDisplayName,
  normalizeUsername,
  validateUsername,
} from "../../lib/userIdentity";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    const { email, identifier, password, confirmPassword, mode } = req.body;

    if (!password || typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }

    if (mode === "register") {
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email no valido" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Email no valido" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          error: "Las contraseñas no coinciden.",
        });
      }

      const displayName = normalizeDisplayName(req.body.displayName);

      if (!displayName) {
        return res.status(400).json({ error: "El nombre visible es obligatorio." });
      }

      const usernameValidation = validateUsername(req.body.username);

      if (usernameValidation.error) {
        return res.status(400).json({ error: usernameValidation.error });
      }

      const username = usernameValidation.username;
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { username }],
        },
        select: { id: true, email: true, username: true, passwordHash: true },
      });

      if (existingUser?.email === normalizedEmail && existingUser.passwordHash) {
        return res
          .status(409)
          .json({ error: "Ya existe una cuenta con este email." });
      }

      if (existingUser?.username === username) {
        return res
          .status(409)
          .json({ error: "Ese nombre de usuario ya esta en uso." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              displayName,
              passwordHash,
              username,
              emailVerified: false,
              profile: {
                upsert: {
                  update: { displayName },
                  create: { displayName },
                },
              },
            },
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              role: true,
            },
          })
        : await prisma.user.create({
            data: {
              displayName,
              email: normalizedEmail,
              passwordHash,
              username,
              emailVerified: false,
              profile: {
                create: { displayName },
              },
            },
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              role: true,
            },
          });

      await sendUserVerificationEmail({
        baseUrl: getAppBaseUrl(req),
        email: user.email,
        userId: user.id,
      });

      return res.status(201).json({
        ok: true,
        email: user.email,
        requiresVerification: true,
        message: "Te hemos enviado un email para verificar tu cuenta.",
      });
    }

    const normalizedIdentifier =
      typeof identifier === "string"
        ? identifier.trim().toLowerCase()
        : typeof email === "string"
          ? email.trim().toLowerCase()
          : "";

    if (!normalizedIdentifier) {
      return res.status(400).json({ error: "Introduce tu email o usuario." });
    }

    const user = await prisma.user.findFirst({
      where: isValidEmail(normalizedIdentifier)
        ? { email: normalizedIdentifier }
        : { username: normalizeUsername(normalizedIdentifier) },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        passwordHash: true,
        emailVerified: true,
      },
    });

    if (!user?.passwordHash) {
      return res
        .status(401)
        .json({ error: "Email o contraseña incorrectos." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res
        .status(401)
        .json({ error: "Email o contraseña incorrectos." });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Revisa tu correo y verifica tu cuenta antes de continuar.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    setSessionCookie(res, user.id);
    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
