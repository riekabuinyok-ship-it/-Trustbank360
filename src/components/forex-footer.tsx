import Link from "next/link"

export function ForexFooter() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Home</Link>
              <Link href="/exchange-rates" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Exchange Rates</Link>
              <Link href="/features" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Features</Link>
              <Link href="/pricing" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">About</Link>
              <Link href="/contact" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Contact</Link>
              <Link href="/tutorials" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Tutorials</Link>
              <Link href="/track" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Track Transfer</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <div className="space-y-2">
              <Link href="/api/public/rates" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Live Rates API</Link>
              <Link href="#" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">API Status</Link>
              <Link href="#" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Blog</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-2">
              <Link href="#" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Privacy Policy</Link>
              <Link href="#" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Terms of Service</Link>
              <Link href="#" className="block text-sm text-white/40 hover:text-[#00FF88] transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-6 text-center text-xs text-white/20">
          &copy; {new Date().getFullYear()} TB360. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
