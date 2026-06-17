"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight, Shield, Lock, TrendingUp, DollarSign, Banknote } from "lucide-react"

const plans = [
  {
    name: "Small Company",
    subtitle: "For small money transfer businesses",
    monthlyPrice: "$10",
    yearlyPrice: "$7",
    period: "/month",
    cta: "Start Free Trial",
    href: "/signup",
    popular: false,
    features: [
      { text: "1 Month Free Trial", included: true },
      { text: "Up to 2 Branches", included: true },
      { text: "Up to 5 Staff Users", included: true },
      { text: "Basic Money Transfers", included: true },
      { text: "Customer Management", included: true },
      { text: "Basic Reports", included: true },
      { text: "Email Support", included: true },
      { text: "Secure Cloud Hosting", included: true },
      { text: "Branch Wallets", included: true },
      { text: "Advanced Compliance", included: true },
      { text: "API Access", included: true },
      { text: "Custom Branding", included: true },
      { text: "Up to 2 Active Currencies", included: true, highlight: true },
    ],
    currencies: ["USD + SSP", "USD + EUR", "SSP + KES"],
  },
  {
    name: "Medium Company",
    subtitle: "For growing remittance agencies",
    monthlyPrice: "$30",
    yearlyPrice: "$25",
    period: "/month",
    cta: "Start Free Trial",
    href: "/signup",
    popular: true,
    features: [
      { text: "2 Months Free Trial", included: true },
      { text: "Up to 10 Branches", included: true },
      { text: "Up to 25 Staff Users", included: true },
      { text: "Unlimited Transfers", included: true },
      { text: "Branch Wallets", included: true },
      { text: "KYC & Compliance", included: true },
      { text: "Advanced Reports", included: true },
      { text: "Priority Email & Chat Support", included: true },
      { text: "Branch Performance Analytics", included: true },
      { text: "Audit Logs", included: true },
      { text: "Basic API Access", included: true },
      { text: "Custom Branding", included: true },
      { text: "Up to 6 Active Currencies", included: true, highlight: true },
    ],
    currencies: ["USD + SSP + KES + UGX", "EUR + GBP + XAF"],
  },
  {
    name: "Enterprise",
    subtitle: "For large financial institutions",
    monthlyPrice: "$60",
    yearlyPrice: "$50",
    period: "/month",
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    features: [
      { text: "3 Months Free Trial", included: true },
      { text: "Unlimited Branches", included: true },
      { text: "Unlimited Staff Users", included: true },
      { text: "Unlimited Transfers", included: true },
      { text: "Branch Wallets", included: true },
      { text: "Advanced KYC/AML", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Custom Reports", included: true },
      { text: "24/7 Dedicated Support", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "Priority Processing", included: true },
      { text: "Full API Access", included: true },
      { text: "Custom Integrations", included: true },
      { text: "Custom Branding & Domain", included: true },
      { text: "Enterprise Security Features", included: true },
      { text: "Unlimited Currencies", included: true, highlight: true },
    ],
    currencies: [],
  },
]

const guaranteeItems = [
  { icon: Shield, text: "Secure Stripe Payments" },
  { icon: Banknote, text: "Bank Transfer Supported" },
  { icon: Lock, text: "SSL Encrypted Platform" },
  { icon: TrendingUp, text: "99.9% Uptime Guarantee" },
  { icon: DollarSign, text: "30-Day Money-Back Guarantee" },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      {/* Header */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-surface-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
            Start free. Scale as you grow. No hidden fees, no surprises.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setYearly(false)}
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm transition-colors ${
                !yearly ? "bg-primary-500 text-white shadow-lg" : "bg-surface-100 dark:bg-surface-800 text-surface-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                yearly ? "bg-primary-500 text-white shadow-lg" : "bg-surface-100 dark:bg-surface-800 text-surface-500"
              }`}
            >
              Yearly <span className="text-xs bg-secondary-500 text-white px-2 py-0.5 rounded-full">Save ~30%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 lg:py-20 bg-white dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 transition-shadow hover:shadow-xl ${
                plan.popular
                  ? "border-primary-500 shadow-lg shadow-primary-500/10 scale-105 md:scale-110"
                  : "border-surface-200 dark:border-surface-700"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-500 text-white text-xs font-semibold shadow-lg whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-surface-500 mt-1">{plan.subtitle}</p>
                  <div className="mt-6">
                    <span className="text-5xl font-extrabold text-surface-900 dark:text-white">
                      {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-surface-500 ml-1">{plan.period}</span>
                  </div>
                  {yearly && (
                    <p className="text-xs text-surface-400 mt-2">
                      <span className="line-through text-surface-300">{plan.monthlyPrice}/month</span>{" "}
                      <span className="font-medium text-secondary-500">Save {plan.monthlyPrice === "$10" ? "36" : plan.monthlyPrice === "$30" ? "17" : "17"}%</span>
                    </p>
                  )}
                </div>

                <Link href={plan.href}>
                  <Button className={`w-full mb-8 ${plan.popular ? "" : ""}`} variant={plan.popular ? "default" : "outline"} size="lg">
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        f.highlight ? "text-primary-500" : "text-secondary-500"
                      }`} />
                      <span className={`${f.highlight ? "text-surface-900 dark:text-white font-semibold" : "text-surface-700 dark:text-surface-300"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.currencies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                    <p className="text-xs text-surface-500 mb-2">Examples:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.currencies.map((c) => (
                        <span key={c} className="inline-block px-2 py-1 text-xs rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Currency Management Section */}
      <section className="py-16 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white text-center mb-4">
            Currency Management
          </h2>
          <p className="text-surface-600 dark:text-surface-400 text-center mb-12 max-w-2xl mx-auto">
            Trustbank360 supports multi-currency operations tailored to your plan.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Small Company", max: "2 currencies", desc: "Maximum 2 active currencies" },
              { name: "Medium Company", max: "6 currencies", desc: "Maximum 6 active currencies" },
              { name: "Enterprise", max: "Unlimited currencies", desc: "No currency limits" },
            ].map((item) => (
              <div key={item.name} className="p-6 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-center">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">{item.name}</h3>
                <p className="text-2xl font-bold text-primary-600 mb-1">{item.max}</p>
                <p className="text-sm text-surface-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Administrators can:</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {["Add currencies", "Activate or deactivate currencies", "Configure exchange rates", "Set base currency", "Monitor currency performance"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <CheckCircle2 className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-12 bg-white dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-surface-50 to-secondary-50 dark:from-surface-950 dark:to-surface-900 border border-surface-200 dark:border-surface-700">
            <h3 className="text-xl font-bold text-surface-900 dark:text-white text-center mb-3">30-Day Money-Back Guarantee</h3>
            <p className="text-surface-600 dark:text-surface-400 text-sm text-center leading-relaxed mb-8 max-w-2xl mx-auto">
              Try Trustbank360 risk-free. If you are not satisfied within the first 30 days of your paid subscription, contact our support team for a full refund according to our refund policy.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {guaranteeItems.map((item) => (
                <div key={item.text} className="flex flex-col items-center gap-2 p-3 text-center">
                  <item.icon className="h-6 w-6 text-secondary-500" />
                  <span className="text-xs text-surface-600 dark:text-surface-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Start Your Free Trial Today</h2>
          <p className="text-primary-100 mb-8">No credit card required. Cancel anytime.</p>
          <Link href="/signup">
            <Button size="xl" className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg gap-2">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
