"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, Bug } from "lucide-react"
import toast from "react-hot-toast"

export default function ReportProblemPage() {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/support/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to submit report")
        return
      }
      setSubmitted(true)
      toast.success("Report submitted. We'll review it shortly.")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-secondary-500" />
            </div>
            <CardTitle>Report Submitted</CardTitle>
            <CardDescription>Thank you. Our support team will review your report and respond soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/company/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Report a Problem</h1>
          <p className="text-muted-foreground">Submit a bug report or request help from the support team.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Report</CardTitle>
          <CardDescription>Describe the issue you are experiencing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Brief description of the issue" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={6} placeholder="Describe the problem in detail, including steps to reproduce if applicable." value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
