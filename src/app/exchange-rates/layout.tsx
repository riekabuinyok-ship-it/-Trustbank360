import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Exchange Rate Marketplace",
  description: "Compare live exchange rates from licensed exchange companies in real time. Find the best rates for USD, SSP, KES, UGX, EUR, GBP and more.",
  openGraph: { title: "Exchange Rate Marketplace - TrustBank360", description: "Compare live exchange rates from licensed companies in real time." },
  alternates: { canonical: "/exchange-rates" },
}

export default function ExchangeRatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
