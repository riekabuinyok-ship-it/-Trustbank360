"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Loader2, Send, Ticket, ArrowLeft, Clock } from "lucide-react"
import toast from "react-hot-toast"

interface Ticket {
  id: string
  ticketNumber: string | null
  subject: string
  message: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  lastRepliedAt: string | null
  _count: { replies: number }
}

interface Reply {
  id: string
  message: string
  createdAt: string
  userId: string
  user: { name: string; role: string }
}

interface TicketDetail extends Ticket {
  replies: Reply[]
  user: { name: string; email: string } | null
  company: { name: string } | null
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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function MyTicketsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ticketIdParam = searchParams.get("id")

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(ticketIdParam)
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await fetch("/api/support/reports")
        if (res.ok) {
          const data = await res.json()
          setTickets(data.reports || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [])

  useEffect(() => {
    if (ticketIdParam && tickets.length > 0) {
      const match = tickets.find((t) => t.ticketNumber === ticketIdParam)
      if (match) setSelectedId(match.id)
    }
  }, [ticketIdParam, tickets])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    async function loadDetail() {
      setDetailLoading(true)
      try {
        const res = await fetch(`/api/support/reports/${selectedId}`)
        if (res.ok) {
          const data = await res.json()
          setDetail(data.report)
          router.replace(`/company/my-tickets?id=${data.report.ticketNumber || data.report.id}`, { scroll: false })
        }
      } catch {} finally {
        setDetailLoading(false)
      }
    }
    loadDetail()
  }, [selectedId, router])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [detail?.replies])

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/reports/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDetail(data.report)
      setReplyText("")
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  const selectedTicket = tickets.find((t) => t.id === selectedId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-0 lg:gap-4">
      {/* Ticket List */}
      <div className={`lg:w-80 xl:w-96 shrink-0 ${selectedId ? "hidden lg:block" : "block"}`}>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              My Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Ticket className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No tickets yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedId(ticket.id)
                      if (window.innerWidth < 1024) {
                        const el = document.getElementById("chat-panel")
                        el?.scrollIntoView({ behavior: "smooth" })
                      }
                    }}
                    className={`w-full text-left p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors ${
                      selectedId === ticket.id ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {ticket.ticketNumber || ticket.id.substring(0, 8)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(ticket.updatedAt)}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={statusColors[ticket.status] || ""}>{ticket.status.replace(/_/g, " ")}</Badge>
                      <Badge className={priorityColors[ticket.priority] || ""}>{ticket.priority}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Panel */}
      <div id="chat-panel" className={`flex-1 flex flex-col ${!selectedId ? "hidden lg:flex" : "flex"}`}>
        <Card className="flex-1 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Ticket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a ticket to view the conversation</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b shrink-0">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold truncate">{detail.subject}</h2>
                    <Badge className={statusColors[detail.status] || ""}>{detail.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {detail.ticketNumber && <>{detail.ticketNumber} &middot; </>}
                    Created {new Date(detail.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {detail.replies.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No messages yet
                  </div>
                ) : (
                  detail.replies.map((reply, i) => {
                    const isUser = reply.user.role !== "platform_owner"
                    const showAvatar = i === 0 || detail.replies[i - 1]?.userId !== reply.userId
                    return (
                      <div key={reply.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                          {showAvatar && (
                            <Avatar className="w-8 h-8 mt-1 shrink-0">
                              <AvatarFallback className={`text-xs ${isUser ? "bg-primary-100 text-primary-700" : "bg-surface-200 text-surface-600"}`}>
                                {getInitials(reply.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`${!showAvatar ? "ml-10" : ""}`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isUser
                                  ? "bg-primary-500 text-white rounded-br-md"
                                  : "bg-surface-100 dark:bg-surface-800 text-foreground rounded-bl-md"
                              }`}
                            >
                              {reply.message}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground ${isUser ? "justify-end" : "justify-start"}`}>
                              <span>{formatTime(reply.createdAt)}</span>
                              {showAvatar && <span>&middot; {reply.user.name}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Reply Input */}
              {detail.status !== "CLOSED" && (
                <form onSubmit={handleSendReply} className="flex items-end gap-2 p-4 border-t shrink-0">
                  <Textarea
                    rows={2}
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[44px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply(e)
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={!replyText.trim() || sending} className="h-[44px] w-[44px] shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              )}
              {detail.status === "CLOSED" && (
                <div className="p-4 border-t text-center text-sm text-muted-foreground shrink-0">
                  This ticket is closed. No further replies can be sent.
                </div>
              )}
            </>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
