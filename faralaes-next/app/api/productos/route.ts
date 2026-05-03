import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function GET() {
  const productos = await prisma.producto.findMany();

  return NextResponse.json(productos);
}

export async function POST(request: Request) {
  const body = await request.json();

  const producto = await prisma.producto.create({
    data: {
      nombre: body.nombre,
      precio: Number(body.precio),
    },
  });

  return NextResponse.json(producto, { status: 201 });
}
