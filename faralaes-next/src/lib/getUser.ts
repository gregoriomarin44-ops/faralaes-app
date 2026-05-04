import { prisma } from "./prisma";

export async function getUser(userId: unknown) {
  if (!userId || typeof userId !== "string") {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
  });
}
