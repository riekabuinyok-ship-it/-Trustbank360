"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Banknote, Mail, Phone, MapPin, ArrowRight, Send, Loader2,
  CheckCircle2, Shield, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

const socialLinks = [
  { label: "Facebook", href: "#" },
  { label: "X", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Instagram", href: "#" },
] as const

const quickLinks = [
  { href: "/exchange-rates", label: "Exchange Rates" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/track", label: "Track Transfer" },
  { href: "/tutorials", label: "Tutorials" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const

const resourceLinks = [
  { href: "/help", label: "Help Center" },
  { href: "/api/public/rates", label: "Live Exchange Rates" },
  { href: "/about", label: "API Status" },
  { href: "/blog", label: "Blog" },
] as const

const legalLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Cookie Policy" },
  { href: "#", label: "GDPR Compliance" },
] as const

const trustBadges = [
  { icon: Shield, label: "256-Bit SSL", sub: "Encrypted" },
  { icon: Lock, label: "PCI Compliant", sub: "Level 1" },
  { icon: CheckCircle2, label: "ISO 27001", sub: "Certified" },
] as const

export function PublicFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSubscribed(true)
    setLoading(false)
  }

  return (
    <footer className="bg-surface-900 dark:bg-surface-950 border-t border-surface-800/50">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Column 1 — Brand, Description, Social, Trust Badges */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-6">
            {/* Logo + Tagline */}
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
                <Banknote className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">TrustBank360</span>
                <p className="text-[11px] text-primary-400 font-medium -mt-0.5">Enterprise Fintech</p>
              </div>
            </Link>

            <p className="text-sm text-surface-400 leading-relaxed max-w-xs">
              Enterprise-grade money transfer and remittance management platform powering financial institutions across Africa and beyond. Secure, scalable, and fully compliant.
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => {
                const iconMap: Record<string, string> = { Facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", X: "M4 4l7 9-7 8h2l6-7 6 7h7l-8-10 7-8h-2l-5 6-5-6H4zm3 2h2l7 9.5L20 20h-2l-6-8.5L7 6z", LinkedIn: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", Instagram: "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zm-5 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm7-3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" }
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-surface-800 hover:bg-primary-600 flex items-center justify-center text-surface-400 hover:text-white transition-all duration-200 group"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d={iconMap[s.label]} />
                    </svg>
                  </a>
                )
              })}
            </div>

            {/* Security Trust Badges */}
            <div className="flex flex-wrap gap-2.5">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-800/50 border border-surface-700/50 text-[11px] font-medium text-surface-400"
                >
                  <badge.icon className="h-3 w-3 text-secondary-500" />
                  <span>{badge.label}</span>
                  <span className="text-surface-600">·</span>
                  <span className="text-surface-500">{badge.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-surface-400 hover:text-primary-400 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-surface-600 group-hover:bg-primary-500 transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Resources + Legal */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">Resources</h4>
            <ul className="space-y-3 mb-6">
              {resourceLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-surface-400 hover:text-primary-400 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-surface-600 group-hover:bg-primary-500 transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-surface-400 hover:text-primary-400 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-surface-600 group-hover:bg-primary-500 transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Newsletter + Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">Stay Updated</h4>
            <p className="text-sm text-surface-400 mb-4 leading-relaxed">
              Get product updates, exchange rate insights, and industry news delivered to your inbox.
            </p>

            {/* Newsletter Form */}
            {subscribed ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary-500/10 border border-secondary-500/20 text-sm">
                <div className="w-8 h-8 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-secondary-500" />
                </div>
                <div>
                  <p className="font-medium text-secondary-500 text-xs">Subscribed!</p>
                  <p className="text-surface-400 text-xs">Thanks for joining our newsletter.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-surface-800 border-surface-700 text-surface-200 placeholder:text-surface-500 focus-visible:ring-primary-500 h-9 text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="gap-1.5 h-9 px-3"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Subscribe</span>
                </Button>
              </form>
            )}

            {/* Contact Info */}
            <div className="mt-6 space-y-3 pt-6 border-t border-surface-800">
              <div className="flex items-center gap-2.5 text-sm text-surface-400">
                <div className="w-7 h-7 rounded-md bg-surface-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3.5 w-3.5 text-primary-400" />
                </div>
                <span>hello@trustbank360.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-surface-400">
                <div className="w-7 h-7 rounded-md bg-surface-800 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-3.5 w-3.5 text-primary-400" />
                </div>
                <span>+211 924 440 899</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-surface-400">
                <div className="w-7 h-7 rounded-md bg-surface-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-primary-400" />
                </div>
                <span>Juba, South Sudan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-surface-500">
            &copy; 2026 TrustBank360. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-surface-500">
            <Link href="#" className="hover:text-surface-300 transition-colors">Privacy Policy</Link>
            <span className="text-surface-700">·</span>
            <Link href="#" className="hover:text-surface-300 transition-colors">Terms of Service</Link>
            <span className="text-surface-700">·</span>
            <Link href="#" className="hover:text-surface-300 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
