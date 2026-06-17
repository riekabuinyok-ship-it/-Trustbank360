"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, PlayCircle, ListChecks, ArrowRight, RotateCcw, Smartphone, Building2, DollarSign, Shield, Users } from "lucide-react"
import Link from "next/link"

const steps = [
  { icon: Building2, title: "Create & Manage Branches", desc: "Set up branches, assign staff, and manage multi-location operations." },
  { icon: Users, title: "Onboard Customers", desc: "Register customers with KYC verification and risk assessment." },
  { icon: DollarSign, title: "Process Transactions", desc: "Send money between branches with automatic commission and secret code verification." },
  { icon: Shield, title: "Complete Payouts", desc: "Verify secret codes and complete payouts at the receiving branch." },
  { icon: Smartphone, title: "Mobile Money", desc: "Integrate mobile money providers for cash-to-mobile and mobile-to-cash transactions." },
]

export default function TutorialsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Training Tutorial</h1>
          <p className="text-muted-foreground">TrustBank360 Platform Guide for Staff Onboarding</p>
        </div>
      </div>

      {/* Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            TrustBank360 Training Tutorial
          </CardTitle>
          <CardDescription>
            Watch this tutorial to learn the basics of using the TrustBank360 platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-800 mb-4">
            <iframe
              src="https://www.youtube.com/embed/zrFno1ygJm8"
              title="TrustBank360 Training Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => window.open("https://youtu.be/zrFno1ygJm8?si=4jyaa5Jkn_yVr5nK", "_blank")}>
              <RotateCcw className="h-4 w-4" />
              Watch Again
            </Button>
            <Button className="gap-2" asChild>
              <Link href="https://youtu.be/zrFno1ygJm8?si=4jyaa5Jkn_yVr5nK" target="_blank">
                Open in YouTube
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-secondary" />
            Getting Started Guide
          </CardTitle>
          <CardDescription>
            Step-by-step summary to help you get up and running quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 h-6 bg-primary-200 dark:bg-primary-800" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Secret Codes</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Always verify the customer&apos;s secret code before completing a payout. Never share codes via unsecured channels.</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Commission Tracking</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Commissions are calculated automatically based on company settings. Check the dashboard for commission reports.</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Receipts</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Print receipts at any time from the transaction details page. Reprints are tracked in the audit log.</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Branch Visibility</p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">You can only see transactions for your branch. Supervisory roles see company-wide data.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
