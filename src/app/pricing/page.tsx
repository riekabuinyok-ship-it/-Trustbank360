import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"

const plans = [
  {
    name: "Small Company",
    price: "$10",
    period: "/month",
    desc: "For small money transfer businesses getting started.",
    features: ["Up to 2 branches", "Up to 5 staff users", "2 currencies", "Basic money transfers", "Customer management", "Basic reports", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Medium Company",
    price: "$30",
    period: "/month",
    desc: "For growing remittance agencies expanding operations.",
    features: ["Up to 10 branches", "Up to 25 staff users", "6 currencies", "Unlimited transfers", "Branch wallets", "KYC & compliance", "Advanced reports", "Audit logs", "API access", "Custom branding"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$60",
    period: "/month",
    desc: "For large-scale financial institutions.",
    features: ["Unlimited branches", "Unlimited staff", "Unlimited currencies", "Advanced KYC/AML", "Custom reports", "24/7 dedicated support", "Dedicated account manager", "Full API access", "Custom integrations", "Custom branding & domain"],
    cta: "Contact Sales",
    popular: false,
  },
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
          <p className="text-lg text-white/80 mt-4 max-w-2xl">Choose the plan that fits your business. All plans include a free trial.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 flex flex-col ${plan.popular ? "border-primary shadow-xl shadow-primary/10 scale-105 bg-card" : "border-border"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mt-2">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <div className="border-t border-border my-6" />
                <div className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                  className={`mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-colors text-center ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/25"
                      : "bg-surface-100 dark:bg-surface-800 text-foreground hover:bg-surface-200 dark:hover:bg-surface-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-50 dark:bg-surface-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">Need a Custom Plan?</h2>
          <p className="text-muted-foreground mt-3">Contact our sales team for custom pricing and enterprise features tailored to your needs.</p>
          <Link href="/contact" className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors mt-6">
            Contact Sales
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
