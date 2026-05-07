import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAppBaseUrl,
  sendUserVerificationEmail,
} from "../../lib/emailVerification";
import { prisma } from "../../lib/prisma";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email no valido" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return res.status(200).json({ ok: true });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: "Esta cuenta ya esta verificada." });
  }

  try {
    await sendUserVerificationEmail({
      baseUrl: getAppBaseUrl(req),
      email: user.email,
      userId: user.id,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error reenviando verificacion", error);
    return res.status(500).json({
      error: "No hemos podido enviar el email de verificacion.",
    });
  }
}
