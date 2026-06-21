import { PublicLayout } from "@/components/public-layout"

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: June 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>TRUSTBANK360 (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
              <p className="mt-2">By using TRUSTBANK360, you consent to the practices described in this policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
              <h3 className="font-medium text-foreground mt-3 mb-1">Personal Information</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full name, email address, phone number</li>
                <li>Company name, registration number, tax ID</li>
                <li>Business type and country of operation</li>
                <li>Government-issued ID information (for KYC/AML compliance)</li>
              </ul>
              <h3 className="font-medium text-foreground mt-3 mb-1">Transaction Data</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sender and receiver names, phone numbers</li>
                <li>Transaction amounts, currencies, and dates</li>
                <li>Secret codes, receipts, and payout records</li>
                <li>Mobile money provider details</li>
              </ul>
              <h3 className="font-medium text-foreground mt-3 mb-1">Technical Data</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>IP address, browser type, device information</li>
                <li>Session data, cookies, and usage patterns</li>
                <li>Log files and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To process and manage money transfer transactions</li>
                <li>To verify identities and comply with KYC/AML regulations</li>
                <li>To provide customer support and respond to inquiries</li>
                <li>To improve and optimize our platform</li>
                <li>To send important updates, security alerts, and service notices</li>
                <li>To detect and prevent fraud, abuse, and unauthorized access</li>
                <li>To generate anonymized analytics and reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Storage and Security</h2>
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>256-bit SSL/TLS encryption for all data in transit</li>
                <li>Encrypted database storage at rest</li>
                <li>Role-based access control with granular permissions</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data centers with 99.9% uptime</li>
              </ul>
              <p className="mt-2">Data is stored on secure servers in accordance with applicable data protection laws. We retain your data only as long as necessary to provide our services and comply with legal obligations.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Stripe Inc.</strong> — For processing subscription payments</li>
                <li><strong>Mobile Money Providers</strong> — For processing mobile money transactions</li>
                <li><strong>Regulatory Authorities</strong> — As required by applicable laws and regulations</li>
                <li><strong>Service Providers</strong> — Who assist in operating our platform (hosting, analytics, customer support)</li>
              </ul>
              <p className="mt-2">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Object to or restrict processing of your data</li>
                <li>Request portability of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-2">To exercise these rights, contact us at <a href="mailto:support@trustbank360.com" className="text-primary hover:underline">support@trustbank360.com</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies</h2>
              <p>We use essential cookies for authentication and session management. We also use analytics cookies to improve our platform. You can control cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us:</p>
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
