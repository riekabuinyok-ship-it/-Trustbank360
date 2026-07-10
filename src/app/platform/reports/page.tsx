"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { Search, Loader2, MessageSquare, Mail, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

interface Report {
  id: string
  email: string
  subject: string
  message: string
  priority: string
  status: string
  adminReply: string | null
  repliedAt: string | null
  createdAt: string
  user: { name: string } | null
  company: { name: string } | null
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

export default function PlatformReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)

  async function fetchReports() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      if (priorityFilter) params.set("priority", priorityFilter)
      const res = await fetch(`/api/support/reports?${params.toString()}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch {
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [statusFilter, priorityFilter])

  function handleSearch() { fetchReports() }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/support/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Status updated to ${status}`)
      fetchReports()
      if (selectedReport?.id === id) {
        setSelectedReport((prev) => prev ? { ...prev, status } : null)
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  async function handleReply() {
    if (!selectedReport || !replyText.trim()) return
    setReplyLoading(true)
    try {
      const res = await fetch(`/api/support/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText, status: "RESOLVED" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Reply sent and status set to Resolved")
      setReplyText("")
      fetchReports()
      setSelectedReport(null)
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setReplyLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Reports</h1>
        <p className="text-muted-foreground">Manage user-submitted support requests.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : reports.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="No reports found" description="No support reports match your filters." />
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{report.subject}</h3>
                        <Badge className={statusColors[report.status] || ""}>{report.status.replace("_", " ")}</Badge>
                        <Badge className={priorityColors[report.priority] || ""}>{report.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{report.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{report.email}</span>
                        {report.company && <span>{report.company.name}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                        <MessageSquare className="h-4 w-4 mr-1" /> Reply
                      </Button>
                      <Select value={report.status} onValueChange={(v) => handleStatusChange(report.id, v)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {report.adminReply && (
                    <div className="mt-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900 text-sm">
                      <span className="font-medium text-primary">Reply: </span>
                      {report.adminReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={(o) => { if (!o) setSelectedReport(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to Report</DialogTitle>
            <DialogDescription>
              {selectedReport?.subject} — {selectedReport?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-900 text-sm max-h-32 overflow-y-auto">
              {selectedReport?.message}
            </div>
            <Textarea rows={5} placeholder="Type your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
            <Button onClick={handleReply} disabled={!replyText.trim() || replyLoading}>
              {replyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reply & Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
