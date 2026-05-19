import type { NextApiRequest, NextApiResponse } from "next";
import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { touchUserLastSeen } from "./serverUserActivity";

export const AUTH_COOKIE_NAME = "faralaes_session";

type AuthToken = {
  userId: string;
};

const getAuthSecret = () => {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET no configurado");
  }

  return "faralaes-dev-secret";
};

export const signSessionToken = (userId: string) =>
  jwt.sign({ userId }, getAuthSecret(), { expiresIn: "30d" });

export const verifySessionToken = (token: string): AuthToken | null => {
  try {
    const payload = jwt.verify(token, getAuthSecret());

    if (
      typeof payload === "object" &&
      payload !== null &&
      typeof payload.userId === "string"
    ) {
      return { userId: payload.userId };
    }

    return null;
  } catch {
    return null;
  }
};

const serializeCookie = (
  name: string,
  value: string,
  options: {
    maxAge?: number;
  } = {}
) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge =
    typeof options.maxAge === "number" ? `; Max-Age=${options.maxAge}` : "";

  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}${maxAge}`;
};

export const setSessionCookie = (res: NextApiResponse, userId: string) => {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(AUTH_COOKIE_NAME, signSessionToken(userId), {
      maxAge: 60 * 60 * 24 * 30,
    })
  );
};

export const clearSessionCookie = (res: NextApiResponse) => {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(AUTH_COOKIE_NAME, "", { maxAge: 0 })
  );
};

export const getSessionUser = async (
  req: NextApiRequest
): Promise<User | null> => {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.disabled) {
    return null;
  }

  const touchedAt = await touchUserLastSeen(user.id, user.lastSeenAt).catch(
    () => null
  );

  if (touchedAt) {
    return {
      ...user,
      lastSeenAt: touchedAt,
    };
  }

  return user;
};

export const requireSessionUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const user = await getSessionUser(req);

  if (!user) {
    res.status(401).json({ error: "Inicia sesion para continuar." });
    return null;
  }

  return user;
};

export const requireVerifiedSessionUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const user = await requireSessionUser(req, res);

  if (!user) {
    return null;
  }

  if (!user.emailVerified) {
    res.status(403).json({
      error: "Revisa tu correo y verifica tu cuenta antes de continuar.",
      code: "EMAIL_NOT_VERIFIED",
    });
    return null;
  }

  return user;
};
