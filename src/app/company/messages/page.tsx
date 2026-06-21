"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Search, Loader2, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  lastActiveAt: string | null
  branch?: { name: string }
}

interface Message {
  id: string
  subject: string | null
  content: string
  type: string
  senderId: string
  receiverId: string | null
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
  sender: { name: string }
}

function isActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [messages, setMessages] = useState<Message[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [text, setText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [mobileView, setMobileView] = useState<"inbox" | "chat">("inbox")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadMessages(); loadStaff() }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function loadMessages() {
    try {
      const res = await fetch("/api/messages")
      if (res.ok) setMessages(await res.json())
    } catch {} finally { setLoading(false) }
  }

  async function loadStaff() {
    try {
      const res = await fetch("/api/staff")
      if (res.ok) setStaff(await res.json())
    } catch {}
  }

  const markAsRead = useCallback(async (senderId: string) => {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId }),
    })
    setMessages((prev) => prev.map((m) => m.senderId === senderId && m.receiverId === user?.id ? { ...m, readAt: new Date().toISOString() } : m))
  }, [user?.id])

  const conversations = staff.filter((s) => s.id !== user?.id).map((s) => ({
    ...s,
    lastMessage: messages.filter((m) => m.senderId === s.id || m.receiverId === s.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    unread: messages.some((m) => m.senderId === s.id && m.receiverId === user?.id && !m.readAt),
  })).sort((a, b) => {
    if (!a.lastMessage) return 1
    if (!b.lastMessage) return -1
    return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  })

  const filteredStaff = staff.filter((s) => s.id !== user?.id && (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())))

  const chatMessages = selectedStaff ? messages.filter((m) =>
    (m.senderId === selectedStaff.id && m.receiverId === user?.id) ||
    (m.senderId === user?.id && m.receiverId === selectedStaff.id)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : []

  function openConversation(s: StaffMember) {
    setSelectedStaff(s)
    setMobileView("chat")
    setShowCompose(false)
    setSearchQuery("")
    markAsRead(s.id)
  }

  async function handleSend() {
    if (!text.trim() || !selectedStaff) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, receiverId: selectedStaff.id }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages((prev) => [...prev, msg])
        setText("")
      }
    } catch {} finally { setSending(false) }
  }

  function ActiveDot() {
    return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-surface-900" />
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">Internal communication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Sidebar - Inbox / Search */}
        <div className={`lg:col-span-1 ${mobileView === "chat" ? "hidden lg:block" : ""}`}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Inbox</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowCompose(!showCompose)} className="gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            </CardHeader>

            {showCompose && (
              <div className="px-4 pb-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search staff..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredStaff.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No staff found</p>
                  ) : filteredStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openConversation(s)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-left"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">{getInitials(s.name)}</AvatarFallback>
                        </Avatar>
                        {isActive(s.lastActiveAt) && <ActiveDot />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.role.replace(/_/g, " ")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCompose(true)}>Start a conversation</Button>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className={`w-full text-left p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${
                        selectedStaff?.id === conv.id ? "bg-surface-50 dark:bg-surface-800/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">{getInitials(conv.name)}</AvatarFallback>
                          </Avatar>
                          {isActive(conv.lastActiveAt) && <ActiveDot />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{conv.name}</p>
                            {conv.lastMessage && <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conv.lastMessage?.content || "No messages yet"}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground/60">{conv.role.replace(/_/g, " ")}</p>
                            {conv.unread && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className={`lg:col-span-2 ${mobileView === "inbox" ? "hidden lg:block" : ""}`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileView("inbox")} className="lg:hidden p-1 -ml-1">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {selectedStaff ? (
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">{getInitials(selectedStaff.name)}</AvatarFallback>
                      </Avatar>
                      {isActive(selectedStaff.lastActiveAt) && <ActiveDot />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{selectedStaff.name}</CardTitle>
                        {isActive(selectedStaff.lastActiveAt) && <span className="text-[10px] text-emerald-500 font-medium">Online</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedStaff.role.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                ) : (
                  <CardTitle className="text-base">Select a conversation</CardTitle>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {selectedStaff ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-2 text-muted-foreground/30" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Send a message to start the conversation</p>
                      </div>
                    ) : chatMessages.map((msg) => {
                      const isMe = msg.senderId === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                            isMe
                              ? "bg-primary-500 text-white rounded-br-sm"
                              : "bg-surface-100 dark:bg-surface-800 text-foreground rounded-bl-sm"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                              <p className={`text-[10px] ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {isMe && (
                                <span className={`text-[10px] ${msg.readAt ? "text-white" : msg.deliveredAt ? "text-white/70" : "text-white/40"}`}>
                                  {msg.readAt ? "✓✓" : msg.deliveredAt ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      />
                      <Button size="icon" onClick={handleSend} disabled={!text.trim() || sending}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-20">
                  <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground/30" />
                  <p className="text-sm">Select a conversation to start chatting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
