import { prisma } from "./prisma"

export interface RateLimitConfig {
  maxAttempts: number
  windowSeconds: number
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowSeconds: 300 },
  forgot_password: { maxAttempts: 3, windowSeconds: 600 },
  signup: { maxAttempts: 3, windowSeconds: 3600 },
  force_change_password: { maxAttempts: 5, windowSeconds: 300 },
}

export async function checkRateLimit(
  identifier: string,
  action: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  const cfg = config || DEFAULT_CONFIGS[action] || { maxAttempts: 10, windowSeconds: 60 }
  const now = new Date()
  const windowStart = new Date(now.getTime() - cfg.windowSeconds * 1000)

  const record = await prisma.rateLimit.findFirst({
    where: { identifier, action, windowStart: { gte: windowStart } },
    orderBy: { windowStart: "desc" },
  })

  if (!record) {
    await prisma.rateLimit.create({
      data: { identifier, action, attempts: 1, windowStart: now },
    })
    return { allowed: true, remaining: cfg.maxAttempts - 1, resetInSeconds: cfg.windowSeconds }
  }

  const elapsed = (now.getTime() - record.windowStart.getTime()) / 1000

  if (elapsed > cfg.windowSeconds) {
    await prisma.rateLimit.create({
      data: { identifier, action, attempts: 1, windowStart: now },
    })
    return { allowed: true, remaining: cfg.maxAttempts - 1, resetInSeconds: cfg.windowSeconds }
  }

  if (record.attempts >= cfg.maxAttempts) {
    const resetIn = Math.ceil(cfg.windowSeconds - elapsed)
    return { allowed: false, remaining: 0, resetInSeconds: resetIn }
  }

  await prisma.rateLimit.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  })

  return { allowed: true, remaining: cfg.maxAttempts - record.attempts - 1, resetInSeconds: Math.ceil(cfg.windowSeconds - elapsed) }
}

export async function resetRateLimit(identifier: string, action: string): Promise<void> {
  const now = new Date()
  await prisma.rateLimit.create({
    data: { identifier, action, attempts: 0, windowStart: now },
  })
}

export async function cleanExpiredRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 86400000)
  await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: cutoff } },
  })
}
