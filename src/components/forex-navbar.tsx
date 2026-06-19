"use client"

import { useState } from "react"
import Link from "next/link"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/exchange-rates", label: "Exchange Rates" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function ForexNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">TB</span><span className="text-[#00FF88]">360</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/60 hover:text-[#00FF88] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <span className="text-xs text-white/30 border border-white/10 rounded px-2 py-1 flex items-center gap-1 cursor-default select-none">
              EN <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </span>
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-sm font-medium px-4 py-2 rounded-lg bg-[#00FF88] text-black hover:bg-[#00e67a] transition-colors">
              Start Free Trial
            </Link>
          </div>

          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-white/60 hover:text-white">
            {open ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/5 bg-[#050505]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-[#00FF88] hover:bg-white/5 transition-colors">
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <Link href="/login" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-center">
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium bg-[#00FF88] text-black hover:bg-[#00e67a] transition-colors text-center">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
