import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"
import { ForexBoard } from "@/components/forex-board"
import { HomeStats } from "@/components/home-stats"
import { TryDemoButton } from "@/components/try-demo-button"
import { organizationSchema, softwareApplicationSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: "TrustBank360 - Digital Transaction Record Management for East Africa",
  description: "Replace paper ledgers with secure digital record management. TrustBank360 helps money transfer businesses, forex bureaus, SACCOs, and financial service providers track transactions across South Sudan, Kenya, and Uganda.",
  openGraph: {
    title: "TrustBank360 - Digital Transaction Record Management",
    description: "Replace paper books and manual ledgers with a secure digital platform designed for financial service providers across East Africa.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/" },
}

const jsonLd = [organizationSchema(), softwareApplicationSchema()]

export default function LandingPage() {
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative h-screen overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.hero.main} alt="Money transfer" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Column — Text */}
            <div className="text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs mb-4 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Digital Transaction Record Management
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold text-white leading-tight">
                Transforming Transaction Record Management Across East Africa
              </h1>

              {/* Sub-headline */}
              <p className="mt-3 text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
                Replace paper books and manual ledgers with a secure digital platform designed for money transfer operators, forex bureaus, SACCOs, microfinance institutions, and financial service providers across East Africa.
              </p>

              {/* CTAs — single horizontal row */}
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <Link href="/signup" className="inline-flex items-center px-4 py-2 rounded-lg bg-secondary text-white font-semibold text-sm hover:bg-secondary-600 transition-colors shadow-md shadow-secondary/25 whitespace-nowrap">
                  Start Free Trial
                </Link>
                <Link href="/features" className="inline-flex items-center px-4 py-2 rounded-lg bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors border border-white/30 backdrop-blur-sm whitespace-nowrap">
                  View Features
                </Link>
                <a href="https://youtu.be/zrFno1ygJm8?si=4jyaa5Jkn_yVr5nK" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-sm gap-1.5 whitespace-nowrap">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                  Watch Tutorial
                </a>
                <span className="[&_button]:!px-4 [&_button]:!py-2 [&_button]:!rounded-lg [&_button]:!text-sm"><TryDemoButton /></span>
              </div>
            </div>

            {/* Right Column — Image placeholder */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image src={IMAGES.features.analytics} alt="Dashboard preview" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Exchange Rate Market */}
      <ForexBoard />

      {/* Stats */}
      <HomeStats />

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need to Run Your Business</h2>
            <p className="text-muted-foreground mt-4">From digital transaction recording to branch management and compliance, TrustBank360 replaces paper ledgers with secure, modern tools.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: IMAGES.features.transfers, title: "Digital Transaction Records", desc: "Record transfers between branches with real-time tracking, automated commission calculation, and tamper-proof audit trails — no more paper ledgers." },
              { img: IMAGES.features.mobile, title: "Mobile Money Records", desc: "Digitally record deposits, withdrawals, and mobile-to-mobile transactions with integrated provider support and automatic reconciliation." },
              { img: IMAGES.features.forex, title: "Forex Rate Management", desc: "Manage and record currency exchange transactions, track buy/sell rates in real time, and generate accurate reports instantly." },
            ].map((feat) => (
              <div key={feat.title} className="group rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                <div className="relative h-48 overflow-hidden">
                  <Image src={feat.img} alt={feat.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 bg-surface-50 dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image src={IMAGES.features.security} alt="Security" fill className="object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary text-sm font-medium mb-4">Security & Compliance</div>
              <h2 className="text-3xl sm:text-4xl font-bold">Enterprise-Grade Security for Your Records</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">Role-based access control, comprehensive audit logs, KYC/AML compliance tools, and encrypted data storage. Your transaction records are protected at every level.</p>
              <div className="mt-6 space-y-4">
                {["6 user roles with granular permissions", "Complete audit trail for every transaction", "KYC/AML verification workflows", "Data encryption at rest and in transit"].map((item) => (
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
        </div>
      </section>

      {/* Global Reach */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium mb-4">Global Reach</div>
              <h2 className="text-3xl sm:text-4xl font-bold">Connected Across the Globe</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">Multi-currency support, multi-country operations, and real-time exchange rates. TRUSTBANK360 connects you to markets across Africa, Europe, and the Americas.</p>
              <div className="mt-6 space-y-4">
                {["Support for 7 major currencies", "Operations in 50+ countries", "Real-time exchange rate management", "Multi-language support coming soon"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image src={IMAGES.hero.global} alt="Global" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface-50 dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Trusted by Financial Leaders</h2>
            <p className="text-muted-foreground mt-4">Companies across East Africa rely on TrustBank360 for their transaction record management.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: IMAGES.testimonials.one, name: "John Deng", role: "CEO, Nile Transfers", text: "TrustBank360 transformed how we record transactions. We've eliminated paper ledgers and reduced errors by 60%. Our records are now secure, searchable, and always accurate." },
              { img: IMAGES.testimonials.two, name: "Sarah Akol", role: "Operations Director, EastPay", text: "The audit trail and reporting features give us confidence that every transaction is properly recorded. Our compliance has never been better." },
              { img: IMAGES.testimonials.three, name: "James Ochieng", role: "Founder, KenyaRemit", text: "Branch-level record keeping and multi-currency support were exactly what we needed. We can finally see our full transaction history in one place." },
            ].map((t) => (
              <div key={t.name} className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src={t.img} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="absolute inset-0">
          <Image src={IMAGES.pages.ctaOffice} alt="Office" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Transform Your Business?</h2>
          <p className="text-white/80 mt-4 text-lg">Join hundreds of companies already using TRUSTBANK360. Start your free trial today.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/signup" className="inline-flex items-center px-8 py-3.5 rounded-xl bg-secondary text-white font-semibold hover:bg-secondary-600 transition-colors shadow-lg shadow-secondary/25 text-lg">Start Free Trial</Link>
            <Link href="/contact" className="inline-flex items-center px-8 py-3.5 rounded-xl bg-white/15 text-white font-semibold hover:bg-white/25 transition-colors border border-white/30 backdrop-blur-sm text-lg">Contact Sales</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
