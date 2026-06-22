import { NextResponse } from "next/server"

const DEMO_USERS = [
  {
    email: "admin@trustbank.com",
    label: "Admin",
    role: "Company Owner",
    description: "Full system access, manage branches, staff, billing, and settings",
    icon: "ShieldCheck",
  },
  {
    email: "manager@trustbank.com",
    label: "Manager",
    role: "Branch Manager",
    description: "Oversee branch operations, approve transactions, manage staff",
    icon: "Briefcase",
  },
  {
    email: "teller@trustbank.com",
    label: "Teller",
    role: "Teller",
    description: "Process money transfers, customer onboarding, daily operations",
    icon: "Wallet",
  },
  {
    email: "compliance@trustbank.com",
    label: "Compliance",
    role: "Compliance Officer",
    description: "KYC verification, AML checks, fraud alerts, regulatory reports",
    icon: "FileCheck",
  },
  {
    email: "auditor@trustbank.com",
    label: "Auditor",
    role: "Auditor",
    description: "Read-only access to audit logs, transaction history, and reports",
    icon: "Eye",
  },
]

export async function GET() {
  return NextResponse.json({
    users: DEMO_USERS,
    password: "Admin@123",
    note: "All demo accounts share the same password. Pre-loaded with sample data.",
  })
}
