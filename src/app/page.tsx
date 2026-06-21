import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"
import { ForexBoard } from "@/components/forex-board"
import { HomeStats } from "@/components/home-stats"
import { TryDemoButton } from "@/components/try-demo-button"

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.hero.main} alt="Money transfer" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Enterprise Fintech Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Powering Money Transfer Across Africa and Beyond
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              TRUSTBANK360 is a complete enterprise platform for money transfer businesses, forex bureaus, and mobile money agents. Manage branches, staff, transactions, and compliance from a single dashboard.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/signup" className="inline-flex items-center px-6 py-3 rounded-xl bg-secondary text-white font-semibold hover:bg-secondary-600 transition-colors shadow-lg shadow-secondary/25">
                Start Free Trial
              </Link>
              <Link href="/features" className="inline-flex items-center px-6 py-3 rounded-xl bg-white/15 text-white font-semibold hover:bg-white/25 transition-colors border border-white/30 backdrop-blur-sm">
                View Features
              </Link>
              <a href="https://youtu.be/zrFno1ygJm8?si=4jyaa5Jkn_yVr5nK" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-sm gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                Watch Tutorial
              </a>
              <TryDemoButton />
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
            <p className="text-muted-foreground mt-4">From branch management to compliance, TRUSTBANK360 provides all the tools you need.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: IMAGES.features.transfers, title: "Money Transfers", desc: "Send and receive money across branches with real-time tracking and automated commission calculation." },
              { img: IMAGES.features.mobile, title: "Mobile Money", desc: "Process deposits, withdrawals, and mobile-to-mobile transfers with integrated provider support." },
              { img: IMAGES.features.forex, title: "Forex Bureau", desc: "Manage currency exchange rates, buy and sell currencies with live rate updates." },
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
              <h2 className="text-3xl sm:text-4xl font-bold">Enterprise-Grade Security</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">Role-based access control, comprehensive audit logs, KYC/AML compliance tools, and encrypted data storage. TRUSTBANK360 meets the highest security standards for financial institutions.</p>
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
            <p className="text-muted-foreground mt-4">Companies across Africa rely on TRUSTBANK360 for their money transfer operations.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: IMAGES.testimonials.one, name: "John Deng", role: "CEO, Nile Transfers", text: "TRUSTBANK360 transformed our operations. We've reduced transaction processing time by 60%." },
              { img: IMAGES.testimonials.two, name: "Sarah Akol", role: "Operations Director, EastPay", text: "The compliance and audit features give us confidence to scale across multiple countries." },
              { img: IMAGES.testimonials.three, name: "James Ochieng", role: "Founder, KenyaRemit", text: "Branch management and multi-currency support were exactly what we needed." },
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
