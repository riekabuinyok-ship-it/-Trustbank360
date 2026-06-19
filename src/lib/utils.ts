import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTransactionNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
  return `TXN-${y}${m}${d}-${random}`
}

export function generateSecretCode(companyName: string): string {
  const prefix = companyName.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase()
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0")
  return `${prefix}${random}`
}

export function generateBranchCode(name: string, index: number): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase()
  const num = String(index + 1).padStart(3, "0")
  return `${prefix}${num}`
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function calculateCommission(amount: number, rate: number, type: "INCLUDED" | "SEPARATE"): { commission: number; senderAmount: number; receiverAmount: number } {
  const commission = amount * (rate / 100)
  if (type === "INCLUDED") {
    return {
      commission,
      senderAmount: amount,
      receiverAmount: amount - commission,
    }
  }
  return {
    commission,
    senderAmount: amount + commission,
    receiverAmount: amount,
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + "..."
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CASH_TO_CASH: "Cash → Cash",
    CASH_TO_MOBILE: "Cash → Mobile Money",
    MOBILE_TO_CASH: "Withdrawal",
    MOBILE_TO_MOBILE: "Mobile → Mobile",
    DEPOSIT: "Deposit",
  }
  return labels[type] || type
}

export const transactionTypes = [
  { value: "CASH_TO_CASH", label: "Cash → Cash" },
  { value: "CASH_TO_MOBILE", label: "Cash → Mobile Money" },
  { value: "MOBILE_TO_CASH", label: "Withdrawal" },
  { value: "MOBILE_TO_MOBILE", label: "Mobile → Mobile" },
  { value: "DEPOSIT", label: "Deposit" },
]

export const MOBILE_MONEY_TYPES = ["CASH_TO_MOBILE", "MOBILE_TO_CASH", "MOBILE_TO_MOBILE", "DEPOSIT"]

export function filterTransactionTypes(businessTypes: string[]): { value: string; label: string }[] {
  const isMoneyTransfer = businessTypes.includes("MONEY_TRANSFER_COMPANY")
  const isMobileAgent = businessTypes.includes("MOBILE_MONEY_AGENT")

  if (isMoneyTransfer && !isMobileAgent) {
    return transactionTypes.filter((t) => t.value === "CASH_TO_CASH")
  }
  if (isMobileAgent && !isMoneyTransfer) {
    return transactionTypes.filter((t) => t.value === "CASH_TO_MOBILE" || t.value === "MOBILE_TO_CASH" || t.value === "DEPOSIT")
  }
  return transactionTypes
}
