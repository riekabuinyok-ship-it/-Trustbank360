import type { Metadata } from "next"
import { PublicLayout } from "@/components/public-layout"
import { TryDemoAccountsSection } from "@/components/try-demo-button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Shield, Zap, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Try Demo Accounts | TrustBank360",
  description: "Explore TrustBank360 with pre-loaded demo accounts for every role. No signup required. One click to log in as Company Owner, Branch Manager, Teller, Compliance Officer, or Auditor.",
  openGraph: { title: "Try Demo Accounts | TrustBank360", description: "Log in instantly with pre-loaded demo accounts." },
  alternates: { canonical: "/try-demo" },
  robots: { index: true, follow: true },
}

export default function TryDemoPage() {
  return (
    <PublicLayout>
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
              <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Instant Access — No Signup</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Try TrustBank360 Instantly
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Click any role below to log in with a pre-loaded demo account. Sample data is included — explore features, test workflows, and see how it all works.
            </p>
          </div>

          <Card className="mb-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Pre-loaded Data</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sample company with 3 branches and 4 currencies (SSP, USD, KES, UGX)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Safe to Explore</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All demo data resets regularly. No real money or personal info
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">All 5 Roles</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      See the platform from Admin, Manager, Teller, Compliance & Auditor views
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <TryDemoAccountsSection />

          <div className="mt-10 p-4 rounded-xl border border-border bg-surface-50 dark:bg-surface-900 text-center">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Demo password for all accounts:</strong>{" "}
              <code className="px-2 py-0.5 rounded bg-background font-mono text-foreground">Admin@123</code>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Want to use the platform with your own data?{" "}
              <a href="/signup" className="text-primary font-medium hover:underline">Start your free 30-day trial →</a>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
