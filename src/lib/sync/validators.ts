// TrustBank360 Sync Validators
// Server-side validation logic for incoming offline sync items

import { normalizePhone } from "@/lib/phone-validation"

export interface ValidationResult {
  valid: boolean
  conflict?: {
    type: "DUPLICATE" | "MERGE" | "STALE"
    serverData: any
  }
  error?: string
}

export function validateCustomerForSync(
  existingCustomer: any | null,
  incomingCustomer: any,
  syncId: string
): ValidationResult {
  if (!incomingCustomer) {
    return { valid: false, error: "Customer data is required" }
  }

  if (existingCustomer) {
    // Check if this is a duplicate submission (same sync ID processed already)
    if (existingCustomer._syncId === syncId) {
      return { valid: true }
    }

    // Check for duplicate phone (using normalized comparison)
    const incomingNormalized = incomingCustomer.phone ? normalizePhone(incomingCustomer.phone) : null
    const existingNormalized = existingCustomer.phone ? normalizePhone(existingCustomer.phone) : null
    if (incomingNormalized && existingNormalized && incomingNormalized === existingNormalized) {
      return {
        valid: false,
        conflict: {
          type: "DUPLICATE",
          serverData: existingCustomer,
        },
      }
    }

    // Check for duplicate ID number
    const incomingId = incomingCustomer.idNumber?.toLowerCase().trim()
    const existingId = existingCustomer.idNumber?.toLowerCase().trim()
    if (incomingId && existingId && incomingId === existingId) {
      return {
        valid: false,
        conflict: {
          type: "DUPLICATE",
          serverData: existingCustomer,
        },
      }
    }

    // Check for stale edit (server has newer version)
    if (incomingCustomer.updatedAt && existingCustomer.updatedAt) {
      const incomingTime = new Date(incomingCustomer.updatedAt).getTime()
      const existingTime = new Date(existingCustomer.updatedAt).getTime()
      if (existingTime > incomingTime) {
        return {
          valid: false,
          conflict: {
            type: "STALE",
            serverData: existingCustomer,
          },
        }
      }
    }
  }

  return { valid: true }
}

export function validateTransferForSync(
  existingTransfer: any | null,
  incomingTransfer: any,
  syncId: string
): ValidationResult {
  if (!incomingTransfer) {
    return { valid: false, error: "Transfer data is required" }
  }

  if (existingTransfer) {
    if (existingTransfer._syncId === syncId) {
      return { valid: true }
    }

    // Check for duplicate transaction number
    const incomingTxn = incomingTransfer.transactionNumber?.toLowerCase().trim()
    const existingTxn = existingTransfer.transactionNumber?.toLowerCase().trim()
    if (incomingTxn && existingTxn && incomingTxn === existingTxn) {
      return {
        valid: false,
        conflict: {
          type: "DUPLICATE",
          serverData: existingTransfer,
        },
      }
    }

    // Check for duplicate secret code (if provided)
    const incomingCode = incomingTransfer.secretCode?.toLowerCase().trim()
    const existingCode = existingTransfer.secretCode?.toLowerCase().trim()
    if (incomingCode && existingCode && incomingCode === existingCode) {
      return {
        valid: false,
        conflict: {
          type: "DUPLICATE",
          serverData: existingTransfer,
        },
      }
    }
  }

  // Validate required fields
  if (!incomingTransfer.amount || incomingTransfer.amount <= 0) {
    return { valid: false, error: "Transfer amount must be positive" }
  }

  if (!incomingTransfer.senderId) {
    return { valid: false, error: "Sender is required" }
  }

  if (!incomingTransfer.receiverId) {
    return { valid: false, error: "Receiver is required" }
  }

  return { valid: true }
}

export function validatePayoutForSync(
  existingPayout: any | null,
  incomingPayout: any,
  syncId: string
): ValidationResult {
  if (!incomingPayout) {
    return { valid: false, error: "Payout data is required" }
  }

  if (existingPayout) {
    if (existingPayout._syncId === syncId) {
      return { valid: true }
    }
  }

  // Validate payout is not already processed
  if (existingPayout && existingPayout.status === "COMPLETED") {
    return {
      valid: false,
      conflict: {
        type: "DUPLICATE",
        serverData: existingPayout,
      },
    }
  }

  return { valid: true }
}

export function validateStaffForSync(
  existingStaff: any | null,
  incomingStaff: any,
  syncId: string
): ValidationResult {
  if (!incomingStaff) {
    return { valid: false, error: "Staff data is required" }
  }

  if (existingStaff) {
    if (existingStaff._syncId === syncId) {
      return { valid: true }
    }

    // Check for duplicate email
    const incomingEmail = incomingStaff.email?.toLowerCase().trim()
    const existingEmail = existingStaff.email?.toLowerCase().trim()
    if (incomingEmail && existingEmail && incomingEmail === existingEmail && existingStaff.id !== incomingStaff.id) {
      return {
        valid: false,
        conflict: {
          type: "DUPLICATE",
          serverData: existingStaff,
        },
      }
    }
  }

  return { valid: true }
}

export function validateEditTimestamp(
  localUpdatedAt: string | Date,
  serverUpdatedAt: string | Date
): boolean {
  const local = new Date(localUpdatedAt).getTime()
  const server = new Date(serverUpdatedAt).getTime()
  return local >= server
}
