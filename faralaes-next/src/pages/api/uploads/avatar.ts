import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "../../../lib/auth";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export const config = {
  api: {
    bodyParser: false,
  },
};

const readRequestBody = (req: NextApiRequest) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;

      if (totalBytes > MAX_AVATAR_BYTES) {
        reject(new Error("AVATAR_TOO_LARGE"));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const getMimeType = (buffer: Buffer) => {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return "";
};

const getExtension = (mimeType: string) => {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const user = await requireSessionUser(req, res);

  if (!user) {
    return;
  }

  let buffer: Buffer;

  try {
    buffer = await readRequestBody(req);
  } catch (error) {
    if (error instanceof Error && error.message === "AVATAR_TOO_LARGE") {
      return res.status(400).json({ error: "La imagen debe pesar 2MB como máximo." });
    }

    throw error;
  }

  if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) {
    return res.status(400).json({ error: "La imagen debe pesar 2MB como máximo." });
  }

  const mimeType = getMimeType(buffer);
  const extension = getExtension(mimeType);

  if (!extension) {
    return res.status(400).json({ error: "La imagen no tiene un formato válido." });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${user.id}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const targetPath = path.join(UPLOAD_DIR, filename);

  await writeFile(targetPath, buffer, { flag: "wx" });

  return res.status(201).json({ url: `/uploads/avatars/${filename}` });
}
