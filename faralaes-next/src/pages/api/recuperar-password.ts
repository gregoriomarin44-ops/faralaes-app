import type { NextApiRequest, NextApiResponse } from "next";
import { getAppBaseUrl } from "../../lib/emailVerification";
import {
  PASSWORD_RESET_GENERIC_MESSAGE,
  sendUserPasswordResetEmail,
} from "../../lib/passwordReset";
import { prisma } from "../../lib/prisma";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordResetDebugEnabled = () =>
  process.env.DEBUG_PASSWORD_RESET?.trim().toLowerCase() === "true";

type PasswordResetDebug = {
  userFound: boolean;
  tokenCreated: boolean;
  emailSent: boolean;
  smtpError?: string;
  resetUrl?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const debugEnabled = isPasswordResetDebugEnabled();
  const debug: PasswordResetDebug = {
    userFound: false,
    tokenCreated: false,
    emailSent: false,
  };

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

      debug.userFound = Boolean(user?.passwordHash);

      console.log(debug.userFound ? "user found" : "user not found", {
        email,
      });

      if (user?.passwordHash) {
        const result = await sendUserPasswordResetEmail({
          baseUrl: getAppBaseUrl(req),
          email: user.email,
          userId: user.id,
        });

        debug.tokenCreated = true;
        debug.emailSent = true;
        debug.resetUrl = result.resetUrl;
      }
    } else {
      console.log("user not found", { email });
    }
  } catch (error) {
    console.error("SMTP error:", error);
    debug.smtpError = error instanceof Error ? error.message : String(error);
  }

  if (debugEnabled) {
    return res.status(200).json({
      message: PASSWORD_RESET_GENERIC_MESSAGE,
      ...debug,
    });
  }

  return res.status(200).json({ message: PASSWORD_RESET_GENERIC_MESSAGE });
}
