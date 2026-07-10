"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { ColumnDef } from "@tanstack/react-table"
import { Search, Loader2, Download, Trash2, Send, Users, Megaphone, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

interface Subscriber {
  id: string
  email: string
  name: string | null
  isActive: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

interface Campaign {
  id: string
  subject: string
  content: string
  status: "DRAFT" | "SENT"
  sentCount: number
  sentAt: string | null
  createdAt: string
}

export default function NewsletterPage() {
  const [activeTab, setActiveTab] = useState("subscribers")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage subscribers and send campaigns</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers">
          <SubscribersTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchSubscribers()
  }, [page, debouncedSearch])

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/newsletter/subscribers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers)
        setTotal(data.total)
      } else {
        toast.error("Failed to load subscribers")
      }
    } catch {
      toast.error("Failed to load subscribers")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch])

  async function handleRemove(id: string) {
    setRemovingId(id)
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success("Subscriber removed")
        fetchSubscribers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to remove subscriber")
      }
    } catch {
      toast.error("Failed to remove subscriber")
    } finally {
      setRemovingId(null)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/newsletter/subscribers/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        toast.error("Failed to export subscribers")
      }
    } catch {
      toast.error("Failed to export subscribers")
    } finally {
      setExporting(false)
    }
  }

  const columns: ColumnDef<Subscriber>[] = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.original.name || "-",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "destructive"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "subscribedAt",
      header: "Subscribed",
      cell: ({ row }) => new Date(row.original.subscribedAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={removingId === row.original.id}
          onClick={() => handleRemove(row.original.id)}
        >
          {removingId === row.original.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Subscribers ({total})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading subscribers...
          </div>
        ) : subscribers.length > 0 ? (
          <>
            <DataTable columns={columns} data={subscribers} pageSize={pageSize} />
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground/50" />}
            title="No subscribers yet"
            description="Subscribers will appear here when they sign up."
            actionHref="/"
            actionLabel="Go to Dashboard"
          />
        )}
      </CardContent>
    </Card>
  )
}

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [preview, setPreview] = useState(false)

  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [sendToAll, setSendToAll] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/newsletter/campaigns")
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns)
      } else {
        toast.error("Failed to load campaigns")
      }
    } catch {
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are required")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          content,
          sendTo: sendToAll ? "ALL" : [],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Campaign sent to ${data.campaign.sentCount} subscriber(s)`)
        setSubject("")
        setContent("")
        setSendToAll(true)
        setPreview(false)
        setDialogOpen(false)
        fetchCampaigns()
      } else {
        toast.error(data.error || "Failed to send campaign")
      }
    } catch {
      toast.error("Failed to send campaign")
    } finally {
      setSending(false)
    }
  }

  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.subject}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "SENT" ? "success" : "warning"}>
          {row.original.status === "SENT" ? "Sent" : "Draft"}
        </Badge>
      ),
    },
    {
      accessorKey: "sentCount",
      header: "Recipients",
    },
    {
      accessorKey: "sentAt",
      header: "Sent",
      cell: ({ row }) =>
        row.original.sentAt ? new Date(row.original.sentAt).toLocaleDateString() : "-",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Campaigns
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setPreview(false) }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{preview ? "Preview Campaign" : "New Campaign"}</DialogTitle>
                  <DialogDescription>
                    {preview ? "Review your campaign before sending." : "Compose a new email campaign for your subscribers."}
                  </DialogDescription>
                </DialogHeader>

                {preview ? (
                  <div className="space-y-4 py-4">
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <h3 className="font-semibold text-lg mb-2">{subject || "(No subject)"}</h3>
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                        {content || "(No content)"}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Will be sent to {sendToAll ? "all active subscribers" : "selected recipients"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Campaign subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Write your campaign content..."
                        className="min-h-[200px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sendToAll"
                        checked={sendToAll}
                        onChange={(e) => setSendToAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="sendToAll" className="text-sm font-normal">
                        Send to all active subscribers
                      </Label>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {preview ? (
                    <>
                      <Button variant="outline" onClick={() => setPreview(false)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button onClick={handleSend} disabled={sending}>
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setPreview(true)} disabled={!subject.trim() || !content.trim()}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading campaigns...
            </div>
          ) : campaigns.length > 0 ? (
            <DataTable columns={columns} data={campaigns} />
          ) : (
            <EmptyState
              icon={<Megaphone className="h-8 w-8 text-muted-foreground/50" />}
              title="No campaigns sent yet"
              description="Your first campaign will appear here."
              actionHref="/"
              actionLabel="Go to Dashboard"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
