import { z } from "zod"

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(2, "Company name is required"),
  businessType: z.enum(["MONEY_TRANSFER", "FOREX_BUREAU", "REMITTANCE_COMPANY", "FINANCIAL_INSTITUTION"]),
  country: z.string().min(1, "Country is required"),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  phone: z.string().min(6, "Phone number is required"),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
})

export const transferSchema = z.object({
  senderName: z.string().min(2),
  senderPhone: z.string().min(6),
  senderNationality: z.string().optional(),
  senderIdType: z.string().optional(),
  senderIdNumber: z.string().optional(),
  receiverName: z.string().min(2),
  receiverPhone: z.string().min(6),
  destinationBranchId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["SSP", "USD", "KES", "UGX", "EUR", "GBP"]),
  commissionType: z.enum(["INCLUDED", "SEPARATE"]).default("INCLUDED"),
  notes: z.string().optional(),
})

export const branchSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(1),
  state: z.string().optional(),
  city: z.string().min(1),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
})

export const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().optional(),
  branchId: z.string().min(1),
  role: z.enum(["COMPANY_ADMIN", "BRANCH_MANAGER", "TELLER", "COMPLIANCE_OFFICER", "AUDITOR"]),
})

export const exchangeRateSchema = z.object({
  fromCurrency: z.enum(["SSP", "USD", "KES", "UGX", "EUR", "GBP"]),
  toCurrency: z.enum(["SSP", "USD", "KES", "UGX", "EUR", "GBP"]),
  buyRate: z.number().positive(),
  sellRate: z.number().positive(),
})

export const customerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  nationality: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
})

export const trackTransferSchema = z.object({
  transferCode: z.string().min(1),
  phone: z.string().min(1),
})
