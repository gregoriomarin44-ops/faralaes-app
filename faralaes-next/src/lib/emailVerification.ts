import crypto from "crypto";
import { createMailTransporter, escapeHtml, getRequiredMailEnv } from "./mail";
import { prisma } from "./prisma";

const TOKEN_TTL_HOURS = 24;

export const hashVerificationToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createEmailVerificationToken = async (userId: string) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
};

export const getAppBaseUrl = (req?: { headers?: { host?: string } }) => {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const host = req?.headers?.host;

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol = host.includes("localhost") || host.startsWith("127.")
    ? "http"
    : "https";

  return `${protocol}://${host}`;
};

export const sendVerificationEmail = async ({
  baseUrl,
  email,
  token,
}: {
  baseUrl: string;
  email: string;
  token: string;
}) => {
  const { fromEmail, fromName } = getRequiredMailEnv();
  const transporter = createMailTransporter();
  const verificationUrl = `${baseUrl}/verificar-email?token=${encodeURIComponent(
    token
  )}`;
  const safeUrl = escapeHtml(verificationUrl);

  await transporter.sendMail({
    from: {
      name: fromName,
      address: fromEmail,
    },
    to: email,
    subject: "Verifica tu cuenta de Faralaes",
    text: [
      "Verifica tu cuenta de Faralaes",
      "",
      "Abre este enlace para activar tu cuenta:",
      verificationUrl,
      "",
      "El enlace caduca en 24 horas.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #241f1c;">
        <h2 style="margin: 0 0 16px;">Verifica tu cuenta de Faralaes</h2>
        <p>Abre este enlace para activar tu cuenta:</p>
        <p>
          <a href="${safeUrl}" style="display: inline-block; background: #15803d; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Verificar cuenta
          </a>
        </p>
        <p>Si el boton no funciona, copia y pega este enlace:</p>
        <p style="word-break: break-all;">${safeUrl}</p>
        <p>El enlace caduca en 24 horas.</p>
      </div>
    `,
  });
};

export const sendUserVerificationEmail = async ({
  baseUrl,
  email,
  userId,
}: {
  baseUrl: string;
  email: string;
  userId: string;
}) => {
  const token = await createEmailVerificationToken(userId);
  await sendVerificationEmail({ baseUrl, email, token });
};
