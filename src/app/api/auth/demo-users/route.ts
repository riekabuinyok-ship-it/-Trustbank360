import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    users: [
      { email: "admin@trustbank.com", label: "Admin", role: "Company Owner" },
      { email: "manager@trustbank.com", label: "Manager", role: "Branch Manager" },
      { email: "teller@trustbank.com", label: "Teller", role: "Teller" },
      { email: "compliance@trustbank.com", label: "Compliance", role: "Compliance Officer" },
      { email: "auditor@trustbank.com", label: "Auditor", role: "Auditor" },
    ],
  })
}
