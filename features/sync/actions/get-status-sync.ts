import { prisma } from "@/lib/prisma"

export default async function getStatusSync(domains: string[]) {
  return prisma.syncRegistry.findMany({
    where: { domain: { in: domains } },
  })
}