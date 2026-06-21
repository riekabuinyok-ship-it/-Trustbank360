"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2, PlayCircle } from "lucide-react"

const DEMO_USERS = [
  { email: "admin@trustbank.com", label: "Admin", role: "Company Owner" },
  { email: "manager@trustbank.com", label: "Manager", role: "Branch Manager" },
  { email: "teller@trustbank.com", label: "Teller", role: "Teller" },
  { email: "compliance@trustbank.com", label: "Compliance", role: "Compliance Officer" },
  { email: "auditor@trustbank.com", label: "Auditor", role: "Auditor" },
]

const PASSWORD = "Admin@123"

export function TryDemoButton({ showRoles = false }: { showRoles?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleDemoLogin(email: string) {
    setLoading(email)
    try {
      await signIn("credentials", {
        email,
        password: PASSWORD,
        redirect: true,
        callbackUrl: "/company/dashboard",
      })
    } catch {
      setLoading(null)
    }
  }

  if (showRoles) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center">Try different roles:</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              onClick={() => handleDemoLogin(user.email)}
              disabled={loading !== null}
              className="px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-center disabled:opacity-50"
            >
              {loading === user.email ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <>
                  <span className="text-sm font-medium block">{user.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{user.role}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => handleDemoLogin(DEMO_USERS[0].email)}
      disabled={loading !== null}
      className="inline-flex items-center px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25 gap-2 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <PlayCircle className="h-5 w-5" />
      )}
      Try Demo Account
    </button>
  )
}
