"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Building2, Users, Wallet, Percent, BarChart3, MessageSquare, Shield, Globe, UserCheck, FileSearch, Clock, CheckCircle2, ArrowRight, Smartphone, CreditCard } from "lucide-react"

const featureGroups = [
  {
    title: "Core Operations",
    features: [
      {
        icon: ArrowLeftRight,
        title: "Money Transfer System",
        description: "Create outgoing and incoming transfers with automatic transfer code generation. Track status from Pending to Completed with real-time updates.",
        details: ["Sender & receiver profiles", "Auto-generated transfer codes", "Status tracking (6 statuses)", "Cancellation with auto-reversal"],
      },
      {
        icon: Building2,
        title: "Multi-Branch Management",
        description: "Create and manage unlimited branches, each with independent wallets, staff assignments, and operational controls.",
        details: ["Unlimited branches", "Per-branch wallets", "Branch-specific reporting", "Manager assignment"],
      },
      {
        icon: Users,
        title: "Staff Management",
        description: "Invite team members via email, assign roles, and manage permissions across your organization.",
        details: ["Email invitations", "Role-based access (6 roles)", "Activate/suspend staff", "Password reset"],
      },
      {
        icon: CreditCard,
        title: "Commission System",
        description: "Automatically calculate commissions with two models — included in the amount or paid separately.",
        details: ["Commission included in amount", "Commission paid separately", "Auto-calculation", "Per-transaction tracking"],
      },
    ],
  },
  {
    title: "Financial Management",
    features: [
      {
        icon: Percent,
        title: "Exchange Rate Management",
        description: "Create, update, and schedule exchange rates for all supported currency pairs with full history tracking.",
        details: ["6 supported currencies", "Buy/sell rate spread", "Rate scheduling", "Rate history audit"],
      },
      {
        icon: Wallet,
        title: "Branch Wallet System",
        description: "Each branch gets independent multi-currency wallets that update automatically with every transaction.",
        details: ["SSP, USD, KES, UGX wallets", "Opening & current balance", "Auto-updating balances", "Transaction history"],
      },
      {
        icon: BarChart3,
        title: "Reports & Analytics",
        description: "Generate daily, weekly, and monthly reports. Export to PDF, Excel, or CSV for further analysis.",
        details: ["Daily/weekly/monthly reports", "Branch performance", "Commission reports", "PDF, Excel, CSV export"],
      },
    ],
  },
  {
    title: "Compliance & Security",
    features: [
      {
        icon: Shield,
        title: "KYC & Compliance",
        description: "Built-in identity verification with document uploads, risk scoring, and a dedicated compliance dashboard.",
        details: ["ID document uploads", "Verification status tracking", "Risk level assessment", "Compliance dashboard"],
      },
      {
        icon: UserCheck,
        title: "Fraud Detection",
        description: "Automated fraud detection monitors for repeated cancellations, unusual activity, large transactions, and duplicate IDs.",
        details: ["Repeated cancellation alerts", "Unusual activity detection", "Large transaction monitoring", "Duplicate ID detection"],
      },
      {
        icon: FileSearch,
        title: "Audit Trail",
        description: "Every action is logged with user, timestamp, branch, device, and IP information. Audit logs cannot be deleted.",
        details: ["Complete action logging", "User & timestamp tracking", "Branch & device logging", "Tamper-proof records"],
      },
      {
        icon: Globe,
        title: "Approval Workflows",
        description: "Configurable approval rules ensure large transactions get reviewed by managers or admins before processing.",
        details: ["Configurable thresholds", "Manager/Admin approval", "Automatic routing", "Approval history"],
      },
    ],
  },
  {
    title: "Communication & Access",
    features: [
      {
        icon: MessageSquare,
        title: "Internal Communication",
        description: "Built-in messaging with direct messages, branch group chats, company announcements, and file sharing.",
        details: ["Direct messages", "Branch group chats", "Company announcements", "File & receipt sharing"],
      },
      {
        icon: Smartphone,
        title: "Public Transfer Tracking",
        description: "Customers can track their transfers online using a simple code and phone number. No login required.",
        details: ["Public tracking page", "Transfer code + phone", "Real-time status", "Destination info"],
      },
      {
        icon: Clock,
        title: "Notification System",
        description: "In-app, email, and SMS-ready notifications for new transfers, approval requests, cancellations, and announcements.",
        details: ["In-app notifications", "Email alerts", "SMS-ready", "Event-based triggers"],
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-surface-900 dark:text-white mb-6">
            Enterprise-Grade Features
          </h1>
          <p className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto">
            Everything your money transfer business needs to operate securely, efficiently, and at scale.
          </p>
        </div>
      </section>

      {featureGroups.map((group) => (
        <section key={group.title} className="py-16 lg:py-20 border-b border-surface-100 dark:border-surface-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white mb-12 text-center">
              {group.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {group.features.map((feature) => (
                <div key={feature.title} className="p-6 lg:p-8 rounded-2xl border border-surface-200 dark:border-surface-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-surface-900 dark:text-white">{feature.title}</h3>
                      <p className="text-surface-600 dark:text-surface-400 mt-2 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-2 gap-2 mt-4">
                    {feature.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-xs text-surface-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary-500 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8">Start your 30-day free trial today. No credit card required.</p>
          <Link href="/signup">
            <Button size="xl" className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg gap-2">
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
