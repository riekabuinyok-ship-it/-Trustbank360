import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Your Transfer",
  description: "Track your money transfer status in real time. Enter your secret code and sender's name to check the current status of your transfer.",
  openGraph: { title: "Track Your Transfer - TrustBank360", description: "Track your money transfer status in real time." },
  alternates: { canonical: "/track" },
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children
}
