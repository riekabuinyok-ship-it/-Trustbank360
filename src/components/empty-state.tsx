"use client"

import { Inbox } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EmptyState({
  icon,
  title = "No data found",
  description,
  actionHref = "/dashboard",
  actionLabel = "Return to Dashboard",
}: {
  icon?: React.ReactNode
  title?: string
  description?: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        {icon || <Inbox className="h-8 w-8 text-muted-foreground/50" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>}
      <Link href={actionHref}>
        <Button variant="outline" size="sm">
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}
