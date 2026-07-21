"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Building2,
  Users,
  ArrowLeftRight,
  LineChart,
  MessageSquare,
  Settings,
  ShieldCheck,
  Percent,
  Users2,
  Menu,
  X,
  LogOut,
  Banknote,
  ChevronDown,
  CheckCircle2,
  Smartphone,
  Plus,
  ScrollText,
  Home,
  Bell,
  User as UserIcon,
  RefreshCw,
  Sun,
  Moon,
  Ticket,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useMemo, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { NotificationBell } from "@/components/notifications/notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getNavItems } from "@/lib/permissions"
import { useUnreadMessages } from "@/components/notifications/use-unread-messages"
import { useUnreadTicketReplies } from "@/components/notifications/use-unread-ticket-replies"
import { InstallPrompt } from "@/components/install-prompt"
import { clearSavedRoute } from "@/lib/route-persistence"
import { getPendingCount } from "@/lib/db/sync-queue"

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Building2,
  Users,
  ArrowLeftRight,
  LineChart,
  MessageSquare,
  Settings,
  ShieldCheck,
  Percent,
  Users2,
  Banknote,
  ChevronDown,
  CheckCircle2,
  Smartphone,
  Plus,
  ScrollText,
  RefreshCw,
  Ticket,
}

export function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }
  const user = session?.user as any
  const role = user?.role as string

  const unreadMessages = useUnreadMessages()
  const unreadTicketReplies = useUnreadTicketReplies()
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await getPendingCount()
        setPendingSyncCount(count)
      } catch {}
    }
    checkPending()
    const interval = setInterval(checkPending, 15000)
    return () => clearInterval(interval)
  }, [])

  const navItems = useMemo(() => {
    if (!role) return []
    return getNavItems(role as any).map((item) => ({
      ...item,
      icon: iconMap[item.icon] || LayoutDashboard,
    }))
  }, [role])

  const isCollapsed = collapsed ?? false

  return (
    <>
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-0 z-40 h-screen bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200 dark:border-surface-700">
          <Link href="/company/dashboard" className={cn("flex items-center gap-3 flex-1 min-w-0", isCollapsed && "justify-center")}>
              <img src="/images/logo.svg" alt="TRUSTBANK360" className="flex-shrink-0 w-8 h-8" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                    TrustBank360
                  </h1>
                  <p className="text-xs text-muted-foreground truncate">{user?.companyName || "Enterprise"}</p>
                </div>
              )}
            </Link>
            <div className="flex items-center gap-1 flex-shrink-0">
              <NotificationBell />
              <button
                onClick={onToggle}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-muted-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item: any) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isCollapsed && "justify-center px-2",
                      isActive
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                        : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary-500" : "")} />
                      {(item.href === "/messages" && unreadMessages > 0) && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                      {(item.href === "/company/my-tickets" && unreadTicketReplies > 0) && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {unreadTicketReplies > 9 ? "9+" : unreadTicketReplies}
                        </span>
                      )}
                      {(item.href === "/company/sync-center" && pendingSyncCount > 0) && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                          {pendingSyncCount > 99 ? "99+" : pendingSyncCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          <InstallPrompt />
          <div className={cn("p-3 border-t border-surface-200 dark:border-surface-700", isCollapsed && "px-2")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("flex items-center gap-3 w-full p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors", isCollapsed && "justify-center")}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                      {getInitials(user?.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.role?.replace(/_/g, " ")}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {mounted && theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Sign out of TrustBank360? Your offline session data will be cleared and you will need to reconnect to sign back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              clearSavedRoute()
              document.cookie = "tb360_offline=; path=/; max-age=0"
              signOut({ callbackUrl: "/" })
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const role = user?.role as string
  const unreadMessages = useUnreadMessages()
  const unreadTicketReplies = useUnreadTicketReplies()

  useEffect(() => setMounted(true), [])

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navItems = useMemo(() => {
    if (!role) return []
    return getNavItems(role as any).map((item) => ({
      ...item,
      icon: iconMap[item.icon] || LayoutDashboard,
    }))
  }, [role])

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/company/dashboard" className="flex items-center gap-2">
          <img src="/images/logo.svg" alt="TRUSTBANK360" className="w-7 h-7" />
          <span className="text-sm font-bold">TrustBank360</span>
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
            {getInitials(user?.name || "U")}
          </AvatarFallback>
        </Avatar>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-surface-900 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <img src="/images/logo.svg" alt="TRUSTBANK360" className="w-8 h-8" />
                <span className="font-bold">TrustBank360</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navItems.map((item: any) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                        : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn("h-5 w-5", isActive && "text-primary-500")} />
                      {(item.href === "/messages" && unreadMessages > 0) && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                      {(item.href === "/company/my-tickets" && unreadTicketReplies > 0) && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                          {unreadTicketReplies > 9 ? "9+" : unreadTicketReplies}
                        </span>
                      )}
                    </div>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <InstallPrompt />
            <div className="border-t border-surface-200 dark:border-surface-700 p-4 space-y-1">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors"
              >
                {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Sign out of TrustBank360? Your offline session data will be cleared and you will need to reconnect to sign back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              clearSavedRoute()
              document.cookie = "tb360_offline=; path=/; max-age=0"
              signOut({ callbackUrl: "/" })
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const unreadMessages = useUnreadMessages()
  const unreadTicketReplies = useUnreadTicketReplies()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!user) return null

  const items = [
    { href: "/company/dashboard", label: "Home", icon: Home },
    { href: "/company/transfers", label: "Transfers", icon: ArrowLeftRight },
    { href: "/company/messages", label: "Messages", icon: Bell },
    { href: "/company/settings", label: "Settings", icon: Settings },

  ]

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.href === "/messages" && unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="text-[10px] font-medium">{mounted && theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-danger-500"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>Sign out of TrustBank360? Your offline session data will be cleared.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              clearSavedRoute()
              document.cookie = "tb360_offline=; path=/; max-age=0"
              signOut({ callbackUrl: "/" })
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
