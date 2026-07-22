import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getPrismaUrl(): string {
  try {
    const raw = process.env.DATABASE_URL || "postgresql://localhost:5432/postgres"
    const parsed = new URL(raw)
    parsed.searchParams.set("connection_limit", "3")
    parsed.searchParams.set("pool_timeout", "3")
    parsed.searchParams.set("connect_timeout", "5")
    return parsed.toString()
  } catch {
    return "postgresql://localhost:5432/postgres"
  }
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: getPrismaUrl() } },
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
