"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Banknote, Target, Eye, Globe, Heart, Users, Building2, Percent, Shield, ArrowRight, CheckCircle2 } from "lucide-react"

const values = [
  { icon: Shield, title: "Security First", description: "Every transaction is encrypted, audited, and secured with multi-tenant isolation." },
  { icon: Heart, title: "African Built", description: "Built by Africans for Africa, understanding the unique challenges of remittance markets." },
  { icon: Users, title: "Customer Focused", description: "Every feature is designed to solve real problems faced by money transfer operators." },
  { icon: Globe, title: "Global Reach", description: "Connecting Africa to the world with multi-currency support and international standards." },
]

const timeline = [
  { year: "2024", title: "The Problem", description: "Thousands of money transfer businesses in Africa still use paper books and manual processes." },
  { year: "2025", title: "The Solution", description: "TrustBank360 was created to digitize and modernize remittance operations across the continent." },
  { year: "2026", title: "The Mission", description: "To become the leading fintech platform powering money transfer businesses across Africa and beyond." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto mb-6 flex items-center justify-center shadow-xl">
            <Banknote className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-surface-900 dark:text-white mb-6">
            Why TrustBank360 Exists
          </h1>
          <p className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto leading-relaxed">
            We believe that every money transfer business — whether in Juba, Nairobi, Kampala, or London — deserves access to modern, secure, and affordable financial technology.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800">
              <Eye className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">Our Vision</h3>
              <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                To be the most trusted and widely adopted fintech platform powering money transfer and remittance operations across Africa and the global diaspora.
              </p>
            </div>
            <div className="p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-900/10 border border-secondary-200 dark:border-secondary-800">
              <Target className="h-10 w-10 text-secondary-500 mb-4" />
              <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">Our Mission</h3>
              <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                To equip every money transfer business with enterprise-grade technology that eliminates fraud, automates operations, and enables growth — at an affordable price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white text-center mb-12">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                  <v.icon className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Market */}
      <section className="py-20 bg-white dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-6">Who We Serve</h2>
            <p className="text-surface-600 dark:text-surface-400">TrustBank360 is designed for money transfer businesses of all sizes across Africa and the global remittance corridor.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: "Money Transfer Operators", description: "Independent money transfer businesses sending and receiving funds locally and internationally." },
              { icon: Percent, title: "Forex Bureaus", description: "Currency exchange businesses that need to track rates, transactions, and compliance." },
              { icon: Globe, title: "Remittance Companies", description: "Agencies handling diaspora remittances to and from African countries." },
              { icon: Banknote, title: "Financial Institutions", description: "Banks and microfinance institutions offering money transfer services." },
            ].map((m) => (
              <div key={m.title} className="p-6 rounded-2xl border border-surface-200 dark:border-surface-700 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-center mx-auto mb-4">
                  <m.icon className="h-7 w-7 text-secondary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{m.title}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="py-20 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white text-center mb-12">Our Journey</h2>
          <div className="space-y-8">
            {timeline.map((item, i) => (
              <div key={item.year} className="relative flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shadow-md">
                    {item.year.slice(-2)}
                  </div>
                  {i < timeline.length - 1 && <div className="w-0.5 h-12 bg-primary-200 dark:bg-primary-800" />}
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.title}</h3>
                  <p className="text-surface-600 dark:text-surface-400 text-sm mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Join the Future of Remittance</h2>
          <p className="text-primary-100 mb-8">Start your 30-day free trial today.</p>
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
