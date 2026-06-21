import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"

export const metadata: Metadata = {
  title: "Features",
  description: "Explore TrustBank360 platform features: money transfers, mobile money integration, forex bureau operations, KYC compliance, analytics, and reporting.",
  openGraph: { title: "Features - TrustBank360", description: "Complete platform features for money transfer businesses." },
  alternates: { canonical: "/features" },
}

const features = [
  {
    img: IMAGES.features.transfers,
    title: "Money Transfers",
    desc: "Send and receive money across branches with real-time tracking, secret code verification, and automated commission calculation. Supports cash-to-cash, cash-to-mobile, and mobile-to-mobile transfers.",
    items: ["Real-time transaction tracking", "Secret code verification", "Automated commission", "Cancel & reverse support"],
  },
  {
    img: IMAGES.features.mobile,
    title: "Mobile Money Integration",
    desc: "Process mobile money deposits, withdrawals, and transfers through integrated providers. Float wallet management with automatic reconciliation.",
    items: ["MTN MoMo, M-Pesa, Airtel Money", "Float wallet management", "Automated reconciliation", "Provider switching"],
  },
  {
    img: IMAGES.features.forex,
    title: "Forex Bureau Operations",
    desc: "Manage currency exchange rates, buy and sell currencies, and track forex transactions with real-time rate updates.",
    items: ["Live exchange rate management", "Multi-currency support", "Rate history tracking", "Margin calculation"],
  },
  {
    img: IMAGES.features.analytics,
    title: "Advanced Analytics",
    desc: "Comprehensive dashboards and reports with real-time data on transaction volumes, revenue, branch performance, and more.",
    items: ["Real-time dashboards", "Branch performance metrics", "Revenue analytics", "Custom report builder"],
  },
  {
    img: IMAGES.features.compliance,
    title: "KYC & Compliance",
    desc: "Built-in KYC/AML workflows with customer verification, risk assessment, and complete audit trails for regulatory compliance.",
    items: ["Customer verification workflows", "Risk level assessment", "Audit trail logging", "Compliance reporting"],
  },
  {
    img: IMAGES.features.reports,
    title: "Reporting & Export",
    desc: "Generate professional reports in PDF, Excel, and CSV formats. Scheduled report delivery and customizable templates.",
    items: ["PDF, Excel, CSV exports", "Scheduled reporting", "Custom report templates", "Printable receipts"],
  },
]

export default function FeaturesPage() {
  return (
    <PublicLayout>
      <section className="relative min-h-[50vh] flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.features.hero} alt="Features" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Platform Features</h1>
          <p className="text-lg text-white/80 mt-4 max-w-2xl">Everything your money transfer business needs to operate efficiently and scale across borders.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {features.map((feat, i) => (
            <div key={feat.title} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:grid-flow-dense" : ""}`}>
              <div className={`relative h-[350px] rounded-2xl overflow-hidden shadow-lg ${i % 2 === 1 ? "md:col-start-2" : ""}`}>
                <Image src={feat.img} alt={feat.title} fill className="object-cover" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{feat.title}</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">{feat.desc}</p>
                <div className="mt-6 space-y-3">
                  {feat.items.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-white/80 mt-3">Start your free trial today. No credit card required.</p>
          <Link href="/signup" className="inline-flex items-center px-6 py-3 rounded-xl bg-secondary text-white font-semibold hover:bg-secondary-600 transition-colors mt-6 shadow-lg shadow-secondary/25">
            Start Free Trial
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
