import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const productos = await prisma.listing.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(productos);
  }

  res.status(405).json({ error: "Método no permitido" });
}