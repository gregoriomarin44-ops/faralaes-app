import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { hashPasswordResetToken } from "../../lib/passwordReset";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const confirmPassword =
    typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";

  if (!token) {
    return res.status(400).json({ error: "El enlace no es valido." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Las contraseñas no coinciden." });
  }

  try {
    const tokenHash = hashPasswordResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!resetToken) {
      return res
        .status(400)
        .json({ error: "El enlace no existe o ya se ha utilizado." });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return res.status(400).json({ error: "El enlace ha caducado." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return res.status(200).json({
      message: "Tu contraseña se ha actualizado. Ya puedes entrar.",
    });
  } catch (error) {
    console.error("Error restableciendo password", error);
    return res.status(500).json({ error: "No se ha podido actualizar la contraseña." });
  }
}
