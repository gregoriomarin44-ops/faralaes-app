import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
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

const logLoginDebug = (
  stage: string,
  context: {
    emailRecibido: string;
    userEncontrado?: boolean;
    disabled?: boolean | null;
    emailVerified?: boolean | null;
    verified?: boolean | null;
    passwordHashExiste?: boolean;
    bcryptCompare?: boolean;
  }
) => {
  console.info("[/api/login] Debug", {
    stage,
    emailRecibido: context.emailRecibido,
    userEncontrado: context.userEncontrado,
    disabled: context.disabled,
    emailVerified: context.emailVerified,
    verified: context.verified,
    passwordHashExiste: context.passwordHashExiste,
    bcryptCompare: context.bcryptCompare,
  });
};

const getLoginErrorResponse = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : String(error.meta?.target || "");

      if (target.includes("username")) {
        return { status: 409, error: "Ese nombre de usuario ya esta en uso." };
      }

      if (target.includes("email")) {
        return { status: 409, error: "Ya existe una cuenta con este email." };
      }

      return { status: 409, error: "Ya existe una cuenta con esos datos." };
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return {
        status: 503,
        error:
          "La base de datos no esta actualizada. Aplica las migraciones de Prisma antes de crear cuentas.",
      };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("Faltan variables SMTP")) {
      return {
        status: 503,
        error:
          "No se ha podido enviar el email de verificacion porque falta configurar el correo SMTP.",
      };
    }

    if (error.message.includes("SMTP_PORT")) {
      return {
        status: 503,
        error:
          "No se ha podido enviar el email de verificacion porque SMTP_PORT no es valido.",
      };
    }
  }

  return { status: 500, error: "Error interno del servidor" };
};

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
      const [existingEmailUser, existingUsernameUser] = await Promise.all([
        prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, email: true, passwordHash: true },
        }),
        prisma.user.findUnique({
          where: { username },
          select: { id: true, username: true },
        }),
      ]);

      if (existingEmailUser?.passwordHash) {
        return res
          .status(409)
          .json({ error: "Ya existe una cuenta con este email." });
      }

      if (
        existingUsernameUser &&
        (!existingEmailUser || existingUsernameUser.id !== existingEmailUser.id)
      ) {
        return res
          .status(409)
          .json({ error: "Ese nombre de usuario ya esta en uso." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = existingEmailUser
        ? await prisma.user.update({
            where: { id: existingEmailUser.id },
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
        avatarUrl: true,
        accountType: true,
        verified: true,
        role: true,
        passwordHash: true,
        emailVerified: true,
        disabled: true,
      },
    });

    logLoginDebug("user lookup", {
      emailRecibido: normalizedIdentifier,
      userEncontrado: Boolean(user),
      disabled: user?.disabled ?? null,
      emailVerified: user?.emailVerified ?? null,
      verified: user?.emailVerified ?? null,
      passwordHashExiste: Boolean(user?.passwordHash),
    });

    if (!user?.passwordHash) {
      return res
        .status(401)
        .json({ error: "Email o contraseña incorrectos." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    logLoginDebug("password compare", {
      emailRecibido: normalizedIdentifier,
      userEncontrado: true,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      verified: user.emailVerified,
      passwordHashExiste: Boolean(user.passwordHash),
      bcryptCompare: passwordMatches,
    });

    if (!passwordMatches) {
      return res
        .status(401)
        .json({ error: "Email o contraseña incorrectos." });
    }

    if (user.disabled) {
      return res.status(403).json({
        error: "Tu cuenta esta bloqueada. Contacta con Faralaes.",
        code: "USER_DISABLED",
      });
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
      username: user.username || user.email.split("@")[0],
      displayName: user.displayName || user.email.split("@")[0],
      avatarUrl: user.avatarUrl,
      accountType: user.accountType,
      verified: user.verified,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    const response = getLoginErrorResponse(error);

    return res.status(response.status).json({ error: response.error });
  }
}
