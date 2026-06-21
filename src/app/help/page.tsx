"use client"

import { useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/components/public-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HelpCircle, MessageSquare, Phone, Mail, ChevronDown, ChevronUp, PlayCircle, ExternalLink } from "lucide-react"

const faqs = [
  { q: "How do I create a new transaction?", a: "Click 'New Transaction' from the sidebar or dashboard. Fill in sender/receiver details, amount, and select the destination branch. Review and confirm to create." },
  { q: "How does the payout process work?", a: "The receiving branch verifies the customer's secret code and completes the payout in one step. Navigate to 'Payout' in the sidebar, enter the secret code, and process the payment." },
  { q: "What is the secret code and how is it used?", a: "The secret code is an auto-generated 8-character code (e.g., TRU12345) tied to each transaction. The sender must provide this code to the receiver so the receiving branch can verify and complete the payout." },
  { q: "Can I cancel or reverse a transaction?", a: "Only the sending branch can cancel or reverse a transaction before it has been paid out. Open the transaction details and click 'Cancel' or 'Reverse' with a reason." },
  { q: "How are commissions calculated?", a: "Commissions follow your company's commission settings (Fixed, Percentage, or Hybrid). You can configure this under 'Commission Settings' in the sidebar. Commissions are always tracked separately from transaction amounts." },
  { q: "How do exchange rates work?", a: "Exchange rates are managed per company. Navigate to 'Exchange Rates' to add or update rates. Public rates are visible on the homepage marketplace for customers." },
  { q: "What should I do if a customer forgets their secret code?", a: "The secret code is displayed on the receipt and in the transaction details. Only authorized staff at the sending branch can look up the code. Contact your branch manager for assistance." },
  { q: "How do I print a receipt?", a: "Open any transaction and click 'Print Receipt' in the detail view. You can also reprint at any time using the 'Reprint' button." },
]

export default function HelpCenterPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <PublicLayout>
      <section className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              Help Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">How can we help you?</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Find answers to common questions or get in touch with our support team.</p>
          </div>

          {/* Quick Support Channels */}
          <div className="grid sm:grid-cols-4 gap-4">
            <Card className="hover:border-primary-300 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground truncate">+211 917 744 818</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary-300 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground truncate">support@trustbank360.com</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary-300 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-xs text-muted-foreground truncate">+211 924 440 899</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary-300 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <PlayCircle className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Tutorial</p>
                  <Link href="/tutorials" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Watch video <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-surface-200 dark:border-surface-700 last:border-0">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-3 text-left text-sm font-medium hover:text-primary transition-colors"
                  >
                    {faq.q}
                    {expandedFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="pb-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center p-8 rounded-xl bg-surface-50 dark:bg-surface-900 border border-border">
            <h2 className="text-xl font-bold">Need more help?</h2>
            <p className="text-muted-foreground mt-2">Sign in to access the support form, or contact us directly.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-600 transition-colors text-sm">Sign In</Link>
              <Link href="/signup" className="inline-flex items-center px-4 py-2 rounded-lg border border-border font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-sm">Create Account</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
