import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcrypt"
import { prisma } from "./prisma"
import { checkRateLimit } from "./rate-limit"

function mapRole(role: string): string {
  const roleMap: Record<string, string> = {
    PLATFORM_ADMIN: "platform_owner",
    COMPANY_OWNER: "company_owner",
    COMPANY_ADMIN: "company_admin",
    BRANCH_MANAGER: "branch_manager",
  }
  return roleMap[role] ?? role
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const t0 = Date.now()
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[auth] Missing credentials")
            return null
          }

          console.log("[auth] Login attempt:", credentials.email, "| ts:", t0)

          const ip = (req?.headers as any)?.["x-forwarded-for"] || "unknown"

          // Combined DB check + user lookup in one query (saves one round trip)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { company: true, branch: true },
          })
          console.log("[auth] User lookup | elapsed:", Date.now() - t0, "ms")

          if (!user || !user.password) {
            console.log("[auth] User not found or no password:", credentials.email)
            return null
          }

          if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
            console.log("[auth] User suspended/inactive:", credentials.email, user.status)
            return null
          }

          // Rate limit check — must come after user lookup to ensure the user exists
          const rl = await checkRateLimit(`login:${ip}`, "login")
          if (!rl.allowed) {
            console.log("[auth] Rate limited:", credentials.email, "| elapsed:", Date.now() - t0, "ms")
            return null
          }

          console.log("[auth] Rate limit passed | elapsed:", Date.now() - t0, "ms")

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            console.log("[auth] Invalid password for:", credentials.email)
            return null
          }

          console.log("[auth] Password valid | elapsed:", Date.now() - t0, "ms")

          const now = new Date()
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: now, lastActiveAt: now },
          })

          const isPlatformOwner = mapRole(user.role) === "platform_owner"

          console.log("[auth] Login successful:", credentials.email, "role:", mapRole(user.role), "| total elapsed:", Date.now() - t0, "ms")
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: mapRole(user.role),
            image: user.image,
            companyId: isPlatformOwner ? null : user.companyId,
            branchId: isPlatformOwner ? null : user.branchId,
            companyName: isPlatformOwner ? null : user.company?.name ?? null,
            businessTypes: isPlatformOwner ? [] : user.company?.businessTypes ?? [],
            isActive: isPlatformOwner ? true : user.company?.isActive ?? false,
            companyIsActive: isPlatformOwner ? true : user.company?.isActive ?? false,
            onboardingComplete: isPlatformOwner ? true : user.company?.onboardingComplete ?? false,
            twoFactorEnabled: user.twoFactorEnabled,
            mustChangePassword: user.mustChangePassword,
          }
        } catch (error: any) {
          console.error("[auth] authorize CRASH:", {
            email: credentials?.email,
            error: error?.message || error,
            elapsed: Date.now() - t0,
            stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
          })
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.companyId = (user as any).companyId
        token.branchId = (user as any).branchId
        token.companyName = (user as any).companyName
        token.businessTypes = (user as any).businessTypes
        token.isActive = (user as any).isActive
        token.companyIsActive = (user as any).companyIsActive
        token.onboardingComplete = (user as any).onboardingComplete
        token.twoFactorEnabled = (user as any).twoFactorEnabled
        token.mustChangePassword = (user as any).mustChangePassword
      }
      if (trigger === "update" && token.companyId) {
        try {
          const company = await prisma.company.findUnique({ where: { id: token.companyId as string } })
          if (company) {
            token.companyName = company.name ?? null
            token.businessTypes = company.businessTypes ?? []
            token.isActive = company.isActive
            token.companyIsActive = company.isActive
            token.onboardingComplete = company.onboardingComplete
          }
        } catch (error: any) {
          console.error("[auth] jwt update error:", error?.message || error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).companyId = token.companyId
        ;(session.user as any).branchId = token.branchId
        ;(session.user as any).companyName = token.companyName
        ;(session.user as any).businessTypes = token.businessTypes
        ;(session.user as any).isActive = token.isActive
        ;(session.user as any).companyIsActive = token.companyIsActive
        ;(session.user as any).onboardingComplete = token.onboardingComplete
        ;(session.user as any).twoFactorEnabled = token.twoFactorEnabled
        ;(session.user as any).mustChangePassword = token.mustChangePassword
      }
      return session
    },
  },
}
