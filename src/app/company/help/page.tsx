"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, MessageSquare, Phone, Mail, ChevronDown, ChevronUp, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

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

const reportTypes = [
  { value: "bug", label: "Report a Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
]

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [form, setForm] = useState({ subject: "", type: "bug", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject || !form.message) {
      toast.error("Please fill in all fields")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: form.subject, type: form.type, message: form.message }),
      })
      if (res.ok) {
        setSent(true)
        setForm({ subject: "", type: "bug", message: "" })
      } else {
        toast.error("Failed to send. Please try again.")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <HelpCircle className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">Get support, find answers, and report issues</p>
        </div>
      </div>

      {/* Quick Support Channels */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="hover:border-primary-300 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">WhatsApp Support</p>
              <p className="text-xs text-muted-foreground">+211 917 744 818</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary-300 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Email Support</p>
              <p className="text-xs text-muted-foreground">support@trustbank360.com</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary-300 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Phone className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Phone Support</p>
              <p className="text-xs text-muted-foreground">+211 924 440 899</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* FAQ Section */}
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
                  <div className="pb-3 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report a Problem</CardTitle>
            <CardDescription>Submit a bug report, feature request, or complaint</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Message Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">We&apos;ll get back to you as soon as possible.</p>
                <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Issue Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief summary of your issue" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Description</Label>
                  <Textarea id="message" rows={5} placeholder="Describe your issue in detail..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Report
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
