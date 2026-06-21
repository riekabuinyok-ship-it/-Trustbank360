import type { Metadata } from "next"
import { PublicLayout } from "@/components/public-layout"
import { techArticleSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "TrustBank360 Terms of Service. Understand the terms governing the use of our money transfer and remittance management platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/terms" },
}

const jsonLd = techArticleSchema("Terms of Service", "TrustBank360 Terms of Service - terms governing the use of our platform.", "/terms")

export default function TermsPage() {
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: June 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using TRUSTBANK360 (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>TRUSTBANK360 provides a multi-company money transfer and remittance management platform. Features include:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Money transfer processing between branches</li>
                <li>Mobile money deposit and withdrawal management</li>
                <li>Forex bureau and currency exchange operations</li>
                <li>Customer management and KYC/AML compliance</li>
                <li>Branch and staff management with role-based access</li>
                <li>Reporting and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Account Registration</h2>
              <p>You must register for an account to use the Platform. You agree to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information promptly</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activity under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Subscription and Fees</h2>
              <p>The Platform is offered on a subscription basis with the following plans:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Small Company</strong> — $10/month (2 branches, 5 staff, 2 currencies)</li>
                <li><strong>Medium Company</strong> — $30/month (10 branches, 25 staff, 6 currencies)</li>
                <li><strong>Enterprise</strong> — $60/month (unlimited)</li>
              </ul>
              <p className="mt-2">All plans include a free trial period. Payments are processed securely through Stripe. Subscription fees are non-refundable except as required by law.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Use the Platform for any illegal or fraudulent activity</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Attempt to gain unauthorized access to the Platform</li>
                <li>Interfere with the proper functioning of the Platform</li>
                <li>Use the Platform to process transactions for sanctioned entities or countries</li>
                <li>Engage in money laundering or terrorist financing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Protection</h2>
              <p>We take data protection seriously. Our practices are governed by our Privacy Policy. You retain ownership of your data. We process your data only as necessary to provide our services.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, TRUSTBANK360 shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Service Availability</h2>
              <p>We strive for 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to perform maintenance, updates, and upgrades that may temporarily affect availability. We will provide reasonable notice for planned maintenance.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Termination</h2>
              <p>Either party may terminate the agreement with written notice. Upon termination, your access to the Platform will be revoked. We will provide a reasonable period to export your data. Termination does not relieve you of payment obligations incurred before termination.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of South Sudan. Any disputes shall be resolved through binding arbitration in Juba, South Sudan.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Platform. Continued use after changes constitutes acceptance of the new Terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact</h2>
              <p>For questions about these Terms, contact us at:</p>
              <div className="mt-2 space-y-1">
                <p>Email: <a href="mailto:support@trustbank360.com" className="text-primary hover:underline">support@trustbank360.com</a></p>
                <p>Phone: +211 924 440 899</p>
                <p>Address: Juba, South Sudan</p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
