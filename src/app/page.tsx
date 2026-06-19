import { Metadata } from "next"
import { ForexLayout } from "@/components/forex-layout"
import { ForexNavbar } from "@/components/forex-navbar"
import { ForexBoard } from "@/components/forex-board"
import { ForexFooter } from "@/components/forex-footer"

export const metadata: Metadata = {
  title: "TB360 - Live Exchange Rate Marketplace",
  description: "Compare live exchange rates from licensed companies in real time. Find the best rates instantly.",
}

export default function ForexHomePage() {
  return (
    <ForexLayout>
      <ForexNavbar />

      {/* Hero with Live Board */}
      <section className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00FF88]/20 text-[#00FF88]/80 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
            LIVE MARKET DATA
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-white">Real-Time Exchange Rate</span>
            <br />
            <span className="text-[#00FF88] drop-shadow-[0_0_30px_rgba(0,255,136,0.15)]">Marketplace</span>
          </h1>
          <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm sm:text-base">
            Compare live rates from licensed exchange companies and find the best deal instantly.
          </p>
        </div>

        <ForexBoard />
      </section>

      <ForexFooter />
    </ForexLayout>
  )
}
