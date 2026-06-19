"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Banknote, Menu, X, ChevronDown } from "lucide-react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/exchange-rates", label: "Exchange Rates" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "https://youtu.be/zrFno1ygJm8?si=4jyaa5Jkn_yVr5nK", label: "Watch Tutorial", external: true },
]

export function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-surface-950/90 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-white">TB<span className="text-primary-500">360</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              (link as any).external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1">
                  {link.label}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ) : (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-sm">Start Free Trial</Button>
            </Link>
          </div>

          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) =>
              (link as any).external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                  {link.label} ↗
                </a>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-3 border-t border-surface-200 dark:border-surface-800 space-y-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)}>
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
