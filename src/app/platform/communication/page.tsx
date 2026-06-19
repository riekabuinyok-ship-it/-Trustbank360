"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { MessageSquare, Send, History, Megaphone } from "lucide-react"
import toast from "react-hot-toast"

interface AdminMessage {
  id: string
  title: string
  content: string
  type: string
  targetRole: string | null
  targetPlan: string | null
  targetStatus: string | null
  sentCount: number
  createdAt: string
  createdBy: { name: string; email: string }
}

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  BROADCAST: "default",
  ANNOUNCEMENT: "secondary",
  ALERT: "destructive",
}

export default function AdminCommunicationPage() {
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("BROADCAST")
  const [targetRole, setTargetRole] = useState("ALL")
  const [targetPlan, setTargetPlan] = useState("ALL")
  const [targetStatus, setTargetStatus] = useState("ALL")

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    try {
      const res = await fetch("/api/admin/communication")
      if (res.ok) setMessages(await res.json())
      else toast.error("Unable to load messages. Please try again.")
    } catch {
      toast.error("Unable to load messages. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/admin/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type, targetRole, targetPlan, targetStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Message sent to ${data.sentCount} user(s)`)
        setTitle("")
        setContent("")
        setType("BROADCAST")
        setTargetRole("ALL")
        setTargetPlan("ALL")
        setTargetStatus("ALL")
        fetchMessages()
      } else {
        toast.error(data.error || "Failed to send message")
      }
    } catch {
      toast.error("Unable to send message. Please check your input and try again.")
    } finally {
      setSending(false)
    }
  }

  const columns: ColumnDef<AdminMessage>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.type === "ALERT" ? (
            <Megaphone className="h-4 w-4 text-destructive" />
          ) : (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={typeColors[row.original.type] || "default"}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      id: "target",
      header: "Target",
      cell: ({ row }) => {
        const parts: string[] = []
        if (row.original.targetRole) parts.push(row.original.targetRole)
        if (row.original.targetPlan) parts.push(row.original.targetPlan)
        if (row.original.targetStatus) parts.push(row.original.targetStatus)
        return (
          <span className="text-sm text-muted-foreground">
            {parts.length > 0 ? parts.join(", ") : "All Users"}
          </span>
        )
      },
    },
    {
      accessorKey: "sentCount",
      header: "Sent",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communication Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Send broadcast messages and announcements to platform users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Message title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BROADCAST">Broadcast</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                    <SelectItem value="ALERT">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your message..."
                className="min-h-[120px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Role</label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="COMPANY_OWNER">Company Owner</SelectItem>
                    <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
                    <SelectItem value="BRANCH_MANAGER">Branch Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Plan</label>
                <Select value={targetPlan} onValueChange={setTargetPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Plans</SelectItem>
                    <SelectItem value="Small Company">Small Company</SelectItem>
                    <SelectItem value="Medium Company">Medium Company</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Status</label>
                <Select value={targetStatus} onValueChange={setTargetStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length > 0 ? (
            <DataTable columns={columns} data={messages} searchKey="title" />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No messages sent yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Your first broadcast message will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
