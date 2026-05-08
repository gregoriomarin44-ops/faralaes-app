import type { NextApiRequest, NextApiResponse } from "next";
import { getAppBaseUrl } from "../../lib/emailVerification";
import {
  PASSWORD_RESET_GENERIC_MESSAGE,
  sendUserPasswordResetEmail,
} from "../../lib/passwordReset";
import { prisma } from "../../lib/prisma";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  console.log("password reset requested", {
    email,
    validEmail: isValidEmail(email),
  });

  try {
    if (isValidEmail(email)) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true },
      });

      console.log(user?.passwordHash ? "user found" : "user not found", {
        email,
      });

      if (user?.passwordHash) {
        await sendUserPasswordResetEmail({
          baseUrl: getAppBaseUrl(req),
          email: user.email,
          userId: user.id,
        });
      }
    } else {
      console.log("user not found", { email });
    }
  } catch (error) {
    console.error("SMTP error:", error);
  }

  return res.status(200).json({ message: PASSWORD_RESET_GENERIC_MESSAGE });
}
