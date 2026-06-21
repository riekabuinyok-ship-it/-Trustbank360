"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    setSent(true)
    setLoading(false)
    toast.success("Reset link sent! Check your email.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <img src="/images/logo-white.svg" alt="TRUSTBANK360" className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">TrustBank360</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Reset your password</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{sent ? "Check Your Email" : "Forgot Password?"}</CardTitle>
            <CardDescription>
              {sent
                ? "We've sent a password reset link to your email address."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-secondary-500" />
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button onClick={() => setSent(false)} className="text-primary-500 hover:underline font-medium">
                    try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login" className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 font-medium">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
