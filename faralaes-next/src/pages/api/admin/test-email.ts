import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { createMailTransporter, getRequiredMailEnv } from "../../../lib/mail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await requireAdmin(req, res);

  if (!user) {
    return;
  }

  try {
    const { fromEmail, fromName } = getRequiredMailEnv();
    const transporter = createMailTransporter();

    await transporter.sendMail({
      from: {
        name: fromName,
        address: fromEmail,
      },
      to: user.email,
      subject: "Prueba de email Faralaes",
      text: [
        "Prueba de email Faralaes",
        "",
        "SMTP funciona correctamente para Faralaes.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #241f1c;">
          <h2 style="margin: 0 0 16px;">Prueba de email Faralaes</h2>
          <p>SMTP funciona correctamente para Faralaes.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: `Email de prueba enviado a ${user.email}.`,
    });
  } catch (error) {
    console.error("Error enviando email de prueba admin", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? `No se ha podido enviar el email de prueba: ${error.message}`
          : "No se ha podido enviar el email de prueba.",
    });
  }
}
