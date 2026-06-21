import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"

export const metadata: Metadata = {
  title: "About",
  description: "Learn about TrustBank360's mission to build financial infrastructure for Africa's money transfer ecosystem. We empower money transfer businesses across the continent.",
  openGraph: { title: "About - TrustBank360", description: "Building the financial infrastructure for Africa's money transfer ecosystem." },
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="relative min-h-[50vh] flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.pages.aboutHero} alt="About" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">About TrustBank360</h1>
          <p className="text-lg text-white/80 mt-4 max-w-2xl">Building the financial infrastructure for Africa&apos;s money transfer ecosystem.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                We believe that moving money across borders should be fast, secure, and accessible to everyone. TrustBank360 was built to empower money transfer businesses, forex bureaus, and mobile money agents with the tools they need to serve their communities.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Our platform handles millions of dollars in transactions monthly, connecting senders and receivers across Africa, Europe, and the Americas.
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image src={IMAGES.pages.aboutMission} alt="Mission" fill className="object-cover" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden md:order-last">
              <Image src={IMAGES.pages.aboutAfrica} alt="Africa" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Our Market</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Africa is home to the world&apos;s largest remittance market, with over $90 billion flowing into the continent annually. Yet many money transfer businesses still rely on paper-based processes and fragmented systems.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                TrustBank360 provides a unified platform that digitizes every aspect of the money transfer process, from customer onboarding to payout reconciliation.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold">Our Team</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                We are a team of fintech veterans, software engineers, and compliance experts who understand the unique challenges of the African money transfer industry.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                With decades of combined experience in financial technology, we are committed to building reliable, secure, and scalable solutions for our customers.
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image src={IMAGES.pages.aboutTeam} alt="Team" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Join the TrustBank360 Community</h2>
          <p className="text-white/80 mt-3">Start your free trial and discover why hundreds of businesses trust our platform.</p>
          <Link href="/signup" className="inline-flex items-center px-6 py-3 rounded-xl bg-secondary text-white font-semibold hover:bg-secondary-600 transition-colors mt-6 shadow-lg shadow-secondary/25">
            Get Started Today
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
