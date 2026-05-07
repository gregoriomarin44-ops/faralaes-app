import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    const { email, password, mode } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email no valido" });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Email no valido" });
    }

    if (mode === "register") {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, passwordHash: true },
      });

      if (existingUser?.passwordHash) {
        return res
          .status(409)
          .json({ error: "Ya existe una cuenta con este email." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              passwordHash,
              emailVerified: true,
            },
            select: {
              id: true,
              email: true,
              role: true,
            },
          })
        : await prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash,
              emailVerified: true,
            },
            select: {
              id: true,
              email: true,
              role: true,
            },
          });

      setSessionCookie(res, user.id);
      return res.status(201).json(user);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
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

    setSessionCookie(res, user.id);
    return res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
