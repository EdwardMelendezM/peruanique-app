import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Adapter with postgres adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

// Prisma client instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({adapter})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
