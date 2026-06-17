"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, MapPin, Phone, Send, Loader2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

const contactMethods = [
  { icon: Mail, title: "Email Us", value: "hello@trustbank360.com", description: "We'll respond within 24 hours" },
  { icon: Phone, title: "Call Us", value: "+211 924 440 899", description: "Mon-Fri 8AM-6PM EAT" },
  { icon: MessageSquare, title: "WhatsApp", value: "+211 917 744 818", description: "Quick responses on WhatsApp" },
  { icon: MapPin, title: "Head Office", value: "Juba, South Sudan", description: "Visit us by appointment" },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSent(true)
    setLoading(false)
    toast.success("Message sent! We'll get back to you soon.")
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-surface-900 dark:text-white mb-6">Get In Touch</h1>
          <p className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
            Have a question about TrustBank360? Want a demo? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="space-y-6">
              {contactMethods.map((method) => (
                <div key={method.title} className="flex items-start gap-4 p-5 rounded-xl border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <method.icon className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">{method.title}</h3>
                    <p className="text-primary-600 dark:text-primary-400 text-sm font-medium">{method.value}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Request a Demo</CardTitle>
                <p className="text-sm text-surface-500 mt-1">Fill out the form and our team will get back to you within 24 hours.</p>
              </CardHeader>
              <CardContent>
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-secondary-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Thank You!</h3>
                    <p className="text-sm text-surface-500">We've received your message and will get back to you shortly.</p>
                    <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: "", email: "", company: "", message: "" }) }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="John Deng" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input placeholder="Your Company Name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Tell us about your business and what you're looking for..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
