import { Building2, Smartphone, Percent, Globe } from "lucide-react"

const businessTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  MONEY_TRANSFER_COMPANY: {
    label: "Money Transfer Company",
    icon: Building2,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  MOBILE_MONEY_AGENT: {
    label: "Mobile Money Agent",
    icon: Smartphone,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  FOREX_BUREAU: {
    label: "Forex Bureau",
    icon: Percent,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  REMITTANCE_COMPANY: {
    label: "Remittance Company",
    icon: Globe,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
}

export function getBusinessTypeBadge(type: string) {
  return businessTypeConfig[type]
}

export function BusinessTypeBadge({ type }: { type: string }) {
  const config = businessTypeConfig[type]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}

export function BusinessTypeBadges({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((type) => (
        <BusinessTypeBadge key={type} type={type} />
      ))}
    </div>
  )
}
