import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-surface-950/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src={IMAGES.logo} alt="TrustBank360" width={140} height={32} className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/signup" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-600 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-surface-900 dark:bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg">TrustBank360</h3>
              <p className="text-sm text-white/60 mt-2">Enterprise fintech platform for money transfer and remittance businesses across Africa and beyond.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <div className="space-y-2">
                <Link href="/features" className="block text-sm text-white/60 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
                <Link href="/signup" className="block text-sm text-white/60 hover:text-white transition-colors">Get Started</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-white/60 hover:text-white transition-colors">About Us</Link>
                <Link href="/contact" className="block text-sm text-white/60 hover:text-white transition-colors">Contact</Link>
                <Link href="/tutorials" className="block text-sm text-white/60 hover:text-white transition-colors">Tutorials</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-white/40">
            &copy; {new Date().getFullYear()} TrustBank360. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
