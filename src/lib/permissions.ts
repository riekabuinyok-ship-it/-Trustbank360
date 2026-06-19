import { type UserRole } from "@prisma/client"

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  image?: string
  companyId: string | null
  branchId?: string | null
  companyName: string | null
  businessTypes: string[]
  isActive: boolean
  onboardingComplete: boolean
  twoFactorEnabled: boolean
}

export const roleHierarchy: Record<UserRole, number> = {
  platform_owner: 200,
  company_owner: 100,
  company_admin: 80,
  branch_manager: 60,
  compliance_officer: 50,
  teller: 40,
  auditor: 30,
  // Legacy aliases
  PLATFORM_ADMIN: 200,
  SUPER_ADMIN: 190,
  COMPANY_OWNER: 100,
  COMPANY_ADMIN: 80,
  BRANCH_MANAGER: 60,
  COMPLIANCE_OFFICER: 50,
  TELLER: 40,
  AUDITOR: 30,
}

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function isSupervisoryRole(role: UserRole): boolean {
  return role === "company_owner" || role === "company_admin" || role === "COMPANY_OWNER" || role === "COMPANY_ADMIN"
}

export function isOperationalRole(role: UserRole): boolean {
  return role === "branch_manager" || role === "teller" || role === "BRANCH_MANAGER" || role === "TELLER"
}

export function canManageCompany(role: UserRole): boolean {
  return role === "company_owner" || role === "COMPANY_OWNER"
}

export function canManageBranches(role: UserRole): boolean {
  return isSupervisoryRole(role)
}

export function canManageStaff(role: UserRole): boolean {
  return isSupervisoryRole(role)
}

export function canManageBranchStaff(role: UserRole): boolean {
  return role === "branch_manager" || role === "BRANCH_MANAGER" || canManageStaff(role)
}

export function canViewReports(role: UserRole): boolean {
  return role !== "teller" && role !== "TELLER"
}

export function canManageExchangeRates(role: UserRole): boolean {
  return isSupervisoryRole(role)
}

export function canManageMobileProviders(role: UserRole): boolean {
  return isSupervisoryRole(role)
}

export function canViewAuditLogs(role: UserRole): boolean {
  return role === "company_owner" || role === "auditor" || role === "COMPANY_OWNER" || role === "AUDITOR"
}

export function canAccessSettings(role: UserRole): boolean {
  return isSupervisoryRole(role)
}

export function canAccessBilling(role: UserRole): boolean {
  return role === "company_owner" || role === "COMPANY_OWNER"
}

export function canCancelTransaction(role: UserRole): boolean {
  return isOperationalRole(role)
}

export function canReverseTransaction(role: UserRole): boolean {
  return isOperationalRole(role)
}

export function canProcessPayout(role: UserRole): boolean {
  return isOperationalRole(role)
}

export function canCreateTransaction(role: UserRole): boolean {
  return isOperationalRole(role)
}

export function canPrintReceipt(_role: UserRole): boolean {
  return true
}

export function canViewCompliance(role: UserRole): boolean {
  return role === "compliance_officer" || role === "COMPLIANCE_OFFICER" || isSupervisoryRole(role)
}

export function getNavItems(role: UserRole): { href: string; label: string; icon: string }[] {
  const items: { href: string; label: string; icon: string }[] = [
    { href: "/company/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/company/sync-center", label: "Sync Center", icon: "RefreshCw" },
  ]

  // Help & Tutorials - all users
  items.push({ href: "/company/help", label: "Help", icon: "HelpCircle" })
  items.push({ href: "/company/tutorials", label: "Tutorials", icon: "BookOpen" })

  // All roles see transactions list
  items.push({ href: "/company/transfers", label: "Transactions", icon: "ArrowLeftRight" })

  // Operational roles (BM + Teller) see transaction actions
  if (isOperationalRole(role)) {
    items.push({ href: "/company/transfers/new", label: "New Transfer", icon: "Plus" })
    items.push({ href: "/company/transfers/incoming", label: "Incoming Transfers", icon: "ArrowLeftRight" })
    items.push({ href: "/company/transfers/payout", label: "Payout", icon: "CheckCircle2" })
  }

  // Mobile Money Agent operations
  items.push({ href: "/company/withdrawal", label: "Withdrawal", icon: "ArrowLeftRight" })
  items.push({ href: "/company/deposit", label: "Deposit", icon: "Plus" })

  // Customers - all roles
  items.push({ href: "/company/customers", label: "Customers", icon: "Users2" })

  // Supervisory roles see management items
  if (isSupervisoryRole(role)) {
    items.push({ href: "/company/branches", label: "Branches", icon: "Building2" })
    items.push({ href: "/company/staff", label: "Staff", icon: "Users" })
    items.push({ href: "/company/wallets", label: "Wallets", icon: "Wallet" })
    items.push({ href: "/company/exchange-rates", label: "Exchange Rates", icon: "Percent" })
    items.push({ href: "/company/commissions", label: "Commission Settings", icon: "Percent" })
    items.push({ href: "/company/compliance", label: "Compliance", icon: "ShieldCheck" })
    items.push({ href: "/company/reports", label: "Reports", icon: "LineChart" })
    items.push({ href: "/company/settings", label: "Settings", icon: "Settings" })
    items.push({ href: "/company/billing", label: "Billing", icon: "CreditCard" })
  }

  // Branch Manager sees branch management
  if (role === "branch_manager" || role === "BRANCH_MANAGER") {
    items.push({ href: "/company/staff", label: "Staff", icon: "Users" })
    items.push({ href: "/company/wallets", label: "Wallets", icon: "Wallet" })
    items.push({ href: "/company/exchange-rates", label: "Exchange Rates", icon: "Percent" })
  }

  // Messages - all roles
  items.push({ href: "/company/messages", label: "Messages", icon: "MessageSquare" })

  // Audit Logs - Owner and Auditor
  if (canViewAuditLogs(role)) {
    items.push({ href: "/company/audit-logs", label: "Audit Logs", icon: "ScrollText" })
  }

  // Teller sees exchange rates (view only)
  if (role === "teller" || role === "TELLER") {
    items.push({ href: "/company/exchange-rates", label: "Exchange Rates", icon: "Percent" })
  }

  return items
}

export const roleLabels: Record<UserRole, string> = {
  platform_owner: "Platform Owner",
  company_owner: "Company Owner",
  company_admin: "Company Admin",
  branch_manager: "Branch Manager",
  compliance_officer: "Compliance Officer",
  teller: "Teller",
  auditor: "Auditor",
  // Legacy aliases
  PLATFORM_ADMIN: "Platform Owner",
  SUPER_ADMIN: "Super Admin",
  COMPANY_OWNER: "Company Owner",
  COMPANY_ADMIN: "Company Admin",
  BRANCH_MANAGER: "Branch Manager",
  TELLER: "Teller",
  COMPLIANCE_OFFICER: "Compliance Officer",
  AUDITOR: "Auditor",
}

export const roleColors: Record<UserRole, string> = {
  platform_owner: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:ring-indigo-700",
  company_owner: "bg-purple-100 text-purple-700 ring-1 ring-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:ring-purple-700",
  company_admin: "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:ring-blue-700",
  branch_manager: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:ring-emerald-700",
  teller: "bg-orange-100 text-orange-700 ring-1 ring-orange-300 dark:bg-orange-900/60 dark:text-orange-200 dark:ring-orange-700",
  compliance_officer: "bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:ring-rose-700",
  auditor: "bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600",
  // Legacy aliases
  PLATFORM_ADMIN: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:ring-indigo-700",
  SUPER_ADMIN: "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/60 dark:text-red-200 dark:ring-red-700",
  COMPANY_OWNER: "bg-purple-100 text-purple-700 ring-1 ring-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:ring-purple-700",
  COMPANY_ADMIN: "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:ring-blue-700",
  BRANCH_MANAGER: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:ring-emerald-700",
  TELLER: "bg-orange-100 text-orange-700 ring-1 ring-orange-300 dark:bg-orange-900/60 dark:text-orange-200 dark:ring-orange-700",
  COMPLIANCE_OFFICER: "bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:ring-rose-700",
  AUDITOR: "bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600",
}

export const transferStatusColors: Record<string, string> = {
  ISSUED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  READY_FOR_PAYOUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  APPROVED: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  REVERSED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export const verificationStatusColors: Record<string, string> = {
  UNVERIFIED: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  VERIFIED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export const riskLevelColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}
