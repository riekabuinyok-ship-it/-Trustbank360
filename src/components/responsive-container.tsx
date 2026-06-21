import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className, ...props }: ResponsiveContainerProps) {
  return (
    <div
      className={cn("w-full max-w-full overflow-x-hidden min-w-0", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 4 },
  gap = 4,
  ...props
}: ResponsiveGridProps) {
  const gridCols = [
    cols.default ? `grid-cols-${cols.default}` : "grid-cols-1",
    cols.sm ? `sm:grid-cols-${cols.sm}` : "",
    cols.md ? `md:grid-cols-${cols.md}` : "",
    cols.lg ? `lg:grid-cols-${cols.lg}` : "",
    cols.xl ? `xl:grid-cols-${cols.xl}` : "",
  ].filter(Boolean).join(" ")

  const gapClass = `gap-${gap}`

  return (
    <div
      className={cn("grid w-full", gridCols, gapClass, className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function ResponsiveCard({ children, className, ...props }: ResponsiveCardProps) {
  return (
    <div
      className={cn("w-full max-w-full min-w-0", className)}
      {...props}
    >
      {children}
    </div>
  )
}
