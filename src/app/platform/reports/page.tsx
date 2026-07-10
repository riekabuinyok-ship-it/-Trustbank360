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
import { Search, Loader2, MessageSquare, Mail, Clock, Send } from "lucide-react"
import toast from "react-hot-toast"

interface TicketReply {
  id: string
  message: string
  createdAt: string
  userId: string
  user: { name: string; role: string }
}

interface Report {
  id: string
  ticketNumber: string | null
  email: string
  subject: string
  message: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  user: { name: string; email: string } | null
  company: { name: string } | null
  replies: TicketReply[]
  _count: { replies: number }
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  WAITING_FOR_USER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
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
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")

  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)

  async function fetchReports() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      if (priorityFilter && priorityFilter !== "ALL") params.set("priority", priorityFilter)
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
      toast.success(`Status updated to ${status.replace(/_/g, " ")}`)
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
        body: JSON.stringify({ message: replyText, status: "RESOLVED" }),
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
        <p className="text-muted-foreground">Manage user-submitted support tickets.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
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
                        {report.ticketNumber && (
                          <span className="text-xs font-mono text-muted-foreground shrink-0">{report.ticketNumber}</span>
                        )}
                        <h3 className="font-medium truncate">{report.subject}</h3>
                        <Badge className={statusColors[report.status] || ""}>{report.status.replace("_", " ")}</Badge>
                        <Badge className={priorityColors[report.priority] || ""}>{report.priority}</Badge>
                        {report._count.replies > 0 && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {report._count.replies} reply{report._count.replies !== 1 ? "ies" : "y"}
                          </span>
                        )}
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
                        <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {report.replies && report.replies.length > 0 && (
                    <div className="mt-3 space-y-2 pl-3 border-l-2 border-primary-200 dark:border-primary-800">
                      {report.replies.slice(-2).map((reply) => (
                        <div key={reply.id} className="text-sm">
                          <span className="font-medium text-primary text-xs">{reply.user?.name || "Unknown"}: </span>
                          {reply.message.substring(0, 120)}{reply.message.length > 120 ? "..." : ""}
                        </div>
                      ))}
                      {report._count.replies > 2 && (
                        <p className="text-xs text-muted-foreground">+{report._count.replies - 2} more replies</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={(o) => { if (!o) setSelectedReport(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedReport?.ticketNumber ? `${selectedReport.ticketNumber} — ` : ""}
              {selectedReport?.subject}
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.email}
              {selectedReport?.user?.name ? ` — ${selectedReport.user.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-900 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Original message</span>
              <p className="mt-1">{selectedReport?.message}</p>
            </div>
            {selectedReport?.replies && selectedReport.replies.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Conversation</p>
                {selectedReport.replies.map((reply) => {
                  const isStaff = reply.user?.role === "platform_owner"
                  return (
                    <div key={reply.id} className={`p-3 rounded-lg text-sm ${isStaff ? "bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900" : "bg-surface-50 dark:bg-surface-900"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{reply.user?.name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p>{reply.message}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="space-y-3 pt-3 border-t shrink-0">
            <Textarea rows={3} placeholder="Type your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
              <Button onClick={handleReply} disabled={!replyText.trim() || replyLoading}>
                {replyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Reply & Resolve
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
