"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Megaphone, AlertTriangle, Info } from "lucide-react"

export default function AnnouncementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [announcement, setAnnouncement] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/company/announcements/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setAnnouncement(null)
        else setAnnouncement(data)
      })
      .catch(() => setAnnouncement(null))
      .finally(() => setLoading(false))
  }, [params?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading announcement...
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/company/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Announcement not found
          </CardContent>
        </Card>
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    HIGH: "destructive",
    NORMAL: "default",
    LOW: "secondary",
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {announcement.priority === "HIGH" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <Megaphone className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-xl">{announcement.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <Badge variant={(priorityColors[announcement.priority] || "default") as any}>
              {announcement.priority === "HIGH" ? "Important" : "Announcement"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {announcement.content}
          </div>
        </CardContent>
      </Card>

      {announcement.company?.name && (
        <p className="text-xs text-muted-foreground text-center">
          Posted by TrustBank360 Platform · {announcement.company.name}
        </p>
      )}
    </div>
  )
}
