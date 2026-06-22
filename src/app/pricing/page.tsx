import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"

export const metadata: Metadata = {
  title: "Pricing",
  description: "TrustBank360 Enterprise plan: $60/month with a 30-day free trial. All features included — unlimited branches, staff, currencies, transfers, advanced KYC/AML, dedicated support, and more.",
  openGraph: { title: "Pricing - TrustBank360", description: "Simple, transparent pricing for your money transfer business. All features included." },
  alternates: { canonical: "/pricing" },
}

const features = [
  "Unlimited branches",
  "Unlimited staff",
  "Unlimited currencies (SSP, USD, KES, UGX)",
  "Unlimited transfers",
  "Advanced KYC/AML",
  "Custom reports",
  "24/7 dedicated support",
  "Dedicated account manager",
  "Full API access",
  "Custom integrations",
  "Custom branding & domain",
  "Branch wallets",
  "Audit logs",
  "Priority processing",
]

export default function PricingPage() {
  return (
    <PublicLayout>
      <section className="relative min-h-[45vh] flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.pages.pricingHero} alt="Pricing" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Simple, Transparent Pricing</h1>
          <p className="text-lg text-white/80 mt-4 max-w-2xl">One plan. All features. Start with a 30-day free trial.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border-2 border-primary shadow-xl shadow-primary/10 bg-card overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="p-8 sm:p-10 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Badge label="Most Popular" />
              </div>
              <h3 className="text-2xl font-bold">Enterprise</h3>
              <p className="text-muted-foreground text-sm mt-2">
                For remittance agencies, money transfer businesses, and financial institutions of any size.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-primary">$60</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">30-day free trial • No credit card required</p>
              <div className="border-t border-border my-6" />
              <div className="space-y-3 flex-1">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-colors text-center bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/25"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-50 dark:bg-surface-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">Questions?</h2>
          <p className="text-muted-foreground mt-3">Reach out to our team for custom requirements, volume pricing, or migration assistance.</p>
          <Link href="/contact" className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors mt-6">
            Contact Sales
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
      {label}
    </span>
  )
}
