"use client"

import { Suspense, useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, WifiOff } from "lucide-react"
import toast from "react-hot-toast"
import { TryDemoButton } from "@/components/try-demo-button"
import { UpdateBanner } from "@/components/update-banner"
import { cacheSession, cacheFullSession, getCachedUser, verifyOfflineLogin, createOfflineSessionCookie, registerDevice } from "@/lib/offline-auth"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [cachedUserEmail, setCachedUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    setIsOffline(typeof navigator !== "undefined" && !navigator.onLine)
    const handler = () => setIsOffline(!navigator.onLine)
    window.addEventListener("online", handler)
    window.addEventListener("offline", handler)
    return () => {
      window.removeEventListener("online", handler)
      window.removeEventListener("offline", handler)
    }
  }, [])

  useEffect(() => {
    async function checkCached() {
      if (isOffline) {
        const cached = await getCachedUser(email || "")
        if (cached) setCachedUserEmail(cached.email)
      }
    }
    checkCached()
  }, [isOffline, email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (isOffline) {
      const user = await verifyOfflineLogin(email, password)
      if (user) {
        const cookie = createOfflineSessionCookie(user)
        document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
        await cacheFullSession({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            companyId: user.companyId,
            branchId: user.branchId,
            companyName: user.companyName,
            businessTypes: null,
            isActive: true,
            companyIsActive: true,
            onboardingComplete: true,
            twoFactorEnabled: false,
            mustChangePassword: false,
          },
          expires: new Date(Date.now() + 30 * 86400000).toISOString(),
          cachedAt: Date.now(),
        })
        toast.success("Signed in (offline mode)")
        router.push(user.role === "platform_owner" ? "/platform" : "/company/dashboard")
        router.refresh()
      } else {
        toast.error("Invalid credentials or no cached account found.")
      }
      setLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Network error or invalid credentials — try offline login
        const offlineUser = await verifyOfflineLogin(email, password).catch(() => null)
        if (offlineUser) {
          const cookie = createOfflineSessionCookie(offlineUser)
          document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
          toast.success("Signed in (offline mode)")
          router.push(offlineUser.role === "platform_owner" ? "/platform" : "/company/dashboard")
          router.refresh()
          return
        }
        toast.error("Invalid email or password")
        return
      }

      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      const userData = session?.user

      if (userData) {
        try {
          await cacheSession({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            companyId: userData.companyId,
            branchId: userData.branchId,
            companyName: userData.companyName,
            image: userData.image,
            password,
          })
          await cacheFullSession(session)
          await registerDevice(userData.id, userData.companyId, userData.branchId)
        } catch {}
      }

      // Refresh the offline cookie with fresh claims so it never expires while the user is active
      try {
        const freshCookie = createOfflineSessionCookie({
          id: userData.id, email: userData.email, name: userData.name,
          role: userData.role, companyId: userData.companyId,
          branchId: userData.branchId, companyName: userData.companyName,
          image: null, passwordHash: "", cachedAt: Date.now(),
        })
        document.cookie = `tb360_offline=${freshCookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
      } catch {}

      toast.success("Welcome back!")
      const role = userData?.role
      router.push(role === "platform_owner" ? "/platform" : "/company/dashboard")
      router.refresh()
    } catch {
      // If online, signIn threw — show clear error instead of silently going offline
      if (navigator.onLine) {
        toast.error("Unable to connect to the server. Please try again.")
        return
      }

      // Genuinely offline — try cached credentials
      const user = await verifyOfflineLogin(email, password).catch(() => null)
      if (user) {
        const cookie = createOfflineSessionCookie(user)
        document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
        await cacheFullSession({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            companyId: user.companyId,
            branchId: user.branchId,
            companyName: user.companyName,
            businessTypes: null,
            isActive: true,
            companyIsActive: true,
            onboardingComplete: true,
            twoFactorEnabled: false,
            mustChangePassword: false,
          },
          expires: new Date(Date.now() + 30 * 86400000).toISOString(),
          cachedAt: Date.now(),
        })
        toast.success("Signed in (offline mode)")
        router.push(user.role === "platform_owner" ? "/platform" : "/company/dashboard")
        router.refresh()
      } else {
        toast.error("Unable to connect. Please check your internet connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4">
      <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-50" />
      <div className="relative w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            ← Back to homepage
          </Link>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <img src="/images/logo-white.svg" alt="TRUSTBANK360" className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">TrustBank360</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Enterprise Fintech Platform</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your company account</CardDescription>
          </CardHeader>
          <CardContent>
            {error === "suspended" && (
              <div className="mb-4 p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-sm text-danger-700 dark:text-danger-300">
                Your account has been suspended. Contact your company administrator.
              </div>
            )}

            {isOffline && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                  <WifiOff className="h-4 w-4" />
                  Offline Mode
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {cachedUserEmail
                    ? `Sign in with your cached account to continue offline.`
                    : "No cached account found. Connect to the internet to sign in."}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full bg-[#0F4C81] hover:bg-[#0D3F6E] text-white font-semibold" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isOffline ? "Sign In (Offline)" : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary-500 hover:text-primary-600 font-medium">
                Create Company
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground">Or try our demo account</p>
          </div>
          <TryDemoButton showRoles />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4">
      <UpdateBanner />
        <div className="w-10 h-10 rounded-xl gradient-primary animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
