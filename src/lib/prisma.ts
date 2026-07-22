import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost:5432/postgres")
  url.searchParams.set("connection_limit", "3")
  url.searchParams.set("pool_timeout", "3")
  url.searchParams.set("connect_timeout", "5")

  return new PrismaClient({
    datasources: { db: { url: url.toString() } },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
