import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const getContentType = (filename: string) => {
  const extension = path.extname(filename).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "";
};

const getSafeUploadPath = (pathParts: string[]) => {
  if (
    pathParts.length < 2 ||
    pathParts.some((part) => !/^[a-z0-9._-]+$/i.test(part))
  ) {
    return null;
  }

  const absolutePath = path.resolve(UPLOAD_ROOT, ...pathParts);
  const relativePath = path.relative(UPLOAD_ROOT, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return absolutePath;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const rawPath = req.query.path;
  const pathParts = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const absolutePath = getSafeUploadPath(pathParts);
  const contentType = absolutePath ? getContentType(absolutePath) : "";

  if (!absolutePath || !contentType) {
    return res.status(404).end();
  }

  try {
    const fileStat = await stat(absolutePath);

    if (!fileStat.isFile()) {
      return res.status(404).end();
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(fileStat.size));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return createReadStream(absolutePath)
      .on("error", () => {
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.destroy();
        }
      })
      .pipe(res);
  } catch {
    return res.status(404).end();
  }
}
