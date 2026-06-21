import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help with TrustBank360. Browse FAQs, contact support via WhatsApp, email, or phone. Learn how to create transactions, process payouts, and more.",
  openGraph: { title: "Help Center - TrustBank360", description: "Get help and support for TrustBank360." },
  alternates: { canonical: "/help" },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
