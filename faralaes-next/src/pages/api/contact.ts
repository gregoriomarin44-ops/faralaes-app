import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

type ContactResponse = {
  ok?: true;
  error?: string;
};

const MAX_NAME_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 4000;

const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "MAIL_FROM",
  "MAIL_FROM_NAME",
  "CONTACT_TO",
] as const;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

const isSmtpSecure = () => {
  const value = (process.env.SMTP_SECURE || "").trim().toLowerCase();

  return value === "true" || value === "1" || value === "yes";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const honeypot = normalizeString(req.body?.website);

  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  const nombre = normalizeString(req.body?.nombre);
  const email = normalizeString(req.body?.email).toLowerCase();
  const mensaje = normalizeString(req.body?.mensaje);

  if (!nombre || nombre.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: "Introduce un nombre valido." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Introduce un email valido." });
  }

  if (!mensaje || mensaje.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Introduce un mensaje valido." });
  }

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    console.error(
      `Faltan variables de entorno para contacto: ${missingEnvVars.join(", ")}`
    );
    return res.status(500).json({
      error: "El formulario no esta disponible ahora mismo.",
    });
  }

  const smtpPort = Number(process.env.SMTP_PORT);

  if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
    console.error("SMTP_PORT no es valido");
    return res.status(500).json({
      error: "El formulario no esta disponible ahora mismo.",
    });
  }

  const fromName = process.env.MAIL_FROM_NAME as string;
  const fromEmail = process.env.MAIL_FROM as string;
  const contactTo = process.env.CONTACT_TO as string;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: isSmtpSecure(),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const safeNombre = escapeHtml(nombre);
  const safeEmail = escapeHtml(email);
  const safeMensaje = escapeHtml(mensaje).replace(/\n/g, "<br />");

  try {
    await transporter.sendMail({
      from: {
        name: fromName,
        address: fromEmail,
      },
      to: contactTo,
      replyTo: {
        name: nombre,
        address: email,
      },
      subject: `Nuevo mensaje de contacto de ${nombre}`,
      text: [
        "Nuevo mensaje de contacto desde Faralaes",
        "",
        `Nombre: ${nombre}`,
        `Email: ${email}`,
        "",
        mensaje,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #241f1c;">
          <h2 style="margin: 0 0 16px;">Nuevo mensaje de contacto</h2>
          <p><strong>Nombre:</strong> ${safeNombre}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <div style="margin-top: 20px;">
            <strong>Mensaje:</strong>
            <p>${safeMensaje}</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error enviando email de contacto", error);
    return res.status(500).json({
      error: "No hemos podido enviar el mensaje. Intentalo de nuevo.",
    });
  }
}
