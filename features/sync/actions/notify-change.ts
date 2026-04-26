import { prisma } from "@/lib/prisma"

export const markAsDirty = async (domain: string) => {
  return prisma.syncRegistry.upsert({
    where: { domain },
    update: { version: { increment: 1 } }, // @updatedAt se encarga del timestamp
    create: { domain, version: 1 },
  })
};