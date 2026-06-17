import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { company: true, branch: true },
        })

        if (!user || !user.password) return null
        if (user.status === "SUSPENDED" || user.status === "INACTIVE") return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        const now = new Date()
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: now, lastActiveAt: now },
        })

        const isPlatformOwner = mapRole(user.role) === "platform_owner"

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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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
