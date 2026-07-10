"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"

export default function ContactPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isLoggedIn = !!user
  const [reportForm, setReportForm] = useState({ subject: "", message: "", priority: "MEDIUM" })
  const [reporting, setReporting] = useState(false)

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reportForm.subject || !reportForm.message) {
      toast.error("Please fill in subject and message")
      return
    }
    setReporting(true)
    try {
      const res = await fetch("/api/support/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportForm),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to submit report")
        return
      }
      toast.success("Report submitted successfully")
      setReportForm({ subject: "", message: "", priority: "MEDIUM" })
    } catch {
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setReporting(false)
    }
  }

  return (
    <PublicLayout>
      <section className="relative min-h-[45vh] flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.pages.contactHero} alt="Contact" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Contact Us</h1>
          <p className="text-lg text-white/80 mt-4 max-w-2xl">Get in touch with our team. We are here to help.</p>
        </div>
      </section>

      {isLoggedIn && (
        <section className="py-12 bg-red-50 dark:bg-red-950/10 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Report a Problem</h2>
              <p className="text-sm text-muted-foreground mb-6">Having an issue? Let us know and we&apos;ll get back to you.</p>
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input placeholder="Brief title of the issue" value={reportForm.subject} onChange={(e) => setReportForm((f) => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <textarea rows={4} placeholder="Describe the problem in detail..." value={reportForm.message} onChange={(e) => setReportForm((f) => ({ ...f, message: e.target.value }))} required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none" />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={reportForm.priority} onValueChange={(v) => setReportForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={reporting} variant="destructive">
                  {reporting ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold">Email</h3>
                <a href="mailto:support@trustbank360.com" className="text-muted-foreground hover:text-primary transition-colors">support@trustbank360.com</a>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Phone</h3>
                <p className="text-muted-foreground">+211 924 440 899</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Address</h3>
                <p className="text-muted-foreground">Juba, South Sudan</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Office Hours</h3>
                <p className="text-muted-foreground">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-muted-foreground">Saturday: 9:00 AM - 2:00 PM</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                    <input id="name" type="text" placeholder="John Deng" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <input id="email" type="email" placeholder="you@company.com" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">Company</label>
                  <input id="company" type="text" placeholder="Your company name" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <textarea id="message" rows={5} placeholder="How can we help you?" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none" />
                </div>
                <button type="submit" className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors shadow-lg">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
