import nodemailer from "nodemailer";

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isSmtpSecure = () => {
  const value = (process.env.SMTP_SECURE || "").trim().toLowerCase();

  return value === "true" || value === "1" || value === "yes";
};

export const getRequiredMailEnv = () => {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "MAIL_FROM",
    "MAIL_FROM_NAME",
  ] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Faltan variables SMTP: ${missing.join(", ")}`);
  }

  const smtpPort = Number(process.env.SMTP_PORT);

  if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
    throw new Error("SMTP_PORT no es valido");
  }

  return {
    fromEmail: process.env.MAIL_FROM as string,
    fromName: process.env.MAIL_FROM_NAME as string,
    smtpPort,
  };
};

export const createMailTransporter = () => {
  const { smtpPort } = getRequiredMailEnv();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: isSmtpSecure(),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};
