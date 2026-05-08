import crypto from "crypto";
import { createMailTransporter, escapeHtml, getRequiredMailEnv } from "./mail";
import { prisma } from "./prisma";

const TOKEN_TTL_HOURS = 1;

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "Si existe una cuenta con ese email, te hemos enviado instrucciones.";

export const hashPasswordResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createPasswordResetToken = async (userId: string) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  console.log("token created", { userId, expiresAt: expiresAt.toISOString() });

  return token;
};

export const sendPasswordResetEmail = async ({
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
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(resetUrl);

  console.log("sending reset email", {
    to: email,
    from: fromEmail,
    baseUrl,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpSecure: process.env.SMTP_SECURE,
  });

  await transporter.sendMail({
    from: {
      name: fromName,
      address: fromEmail,
    },
    to: email,
    subject: "Restablece tu contraseña de Faralaes",
    text: [
      "Restablece tu contraseña de Faralaes",
      "",
      "Abre este enlace para crear una contraseña nueva:",
      resetUrl,
      "",
      "El enlace caduca en 1 hora. Si no has pedido este cambio, puedes ignorar este email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #241f1c;">
        <h2 style="margin: 0 0 16px;">Restablece tu contraseña de Faralaes</h2>
        <p>Abre este enlace para crear una contraseña nueva:</p>
        <p>
          <a href="${safeUrl}" style="display: inline-block; background: #15803d; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Crear nueva contraseña
          </a>
        </p>
        <p>Si el boton no funciona, copia y pega este enlace:</p>
        <p style="word-break: break-all;">${safeUrl}</p>
        <p>El enlace caduca en 1 hora. Si no has pedido este cambio, puedes ignorar este email.</p>
      </div>
    `,
  });

  console.log("reset email sent", { to: email });

  return resetUrl;
};

export const sendUserPasswordResetEmail = async ({
  baseUrl,
  email,
  userId,
}: {
  baseUrl: string;
  email: string;
  userId: string;
}) => {
  const token = await createPasswordResetToken(userId);
  const resetUrl = await sendPasswordResetEmail({ baseUrl, email, token });

  return { resetUrl };
};
