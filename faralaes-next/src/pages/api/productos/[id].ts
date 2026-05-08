import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID no válido" });
    }

    const currentUser = await getSessionUser(req);
    const isAdmin = currentUser?.role === "ADMIN";

    const producto = await prisma.listing.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { status: "published" }),
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            disabled: true,
            profile: true,
          },
        },
      },
    });

    if (!producto || producto.seller.disabled) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    return res.status(200).json(producto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
