import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logTransactionEvent } from "@/lib/log-event"

function generateReceiptHtml(transfer: any, user: any, isReprint: boolean): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "TrustBank360"
  const issuedAt = new Date(transfer.createdAt).toLocaleString()
  const status = transfer.status === "COMPLETED" ? "Paid" : transfer.status

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 8px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0">${label}</td><td style="padding:4px 8px;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right">${value}</td></tr>`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt - ${transfer.transactionNumber}</title>
<style>
  body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; color: #1e293b; }
  .receipt { max-width: 380px; margin: 0 auto; border: 2px solid #0F4C81; border-radius: 12px; padding: 24px; }
  .header { text-align: center; border-bottom: 2px dashed #0F4C81; padding-bottom: 16px; margin-bottom: 16px; }
  .header h1 { margin: 0; color: #0F4C81; font-size: 20px; }
  .header p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
  .code-box { text-align: center; margin: 16px 0; }
  .code-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
  .code-box .code { font-size: 28px; font-weight: bold; color: #0F4C81; letter-spacing: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-paid { background: #dcfce7; color: #16a34a; }
  .status-pending { background: #fef3c7; color: #d97706; }
  .footer { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #94a3b8; }
  .reprint { background: #fef3c7; color: #92400e; font-size: 10px; padding: 4px 8px; border-radius: 4px; text-align: center; margin-top: 8px; }
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>${appName}</h1>
    <p>Transaction Receipt</p>
  </div>
  <div class="code-box">
    <div class="label">Secret Code</div>
    <div class="code">${transfer.secretCode || "—"}</div>
  </div>
  <table>
    ${row("Transaction #", transfer.transactionNumber)}
    ${row("Type", (transfer.transactionType || "").replace(/_/g, " → "))}
    ${row("Amount", `${transfer.amount.toFixed(2)} ${transfer.currency}`)}
    ${row("Commission", `${transfer.commission.toFixed(2)} ${transfer.currency}`)}
    ${row("Total", `${transfer.totalAmount.toFixed(2)} ${transfer.currency}`)}
    ${row("Status", `<span class="status-badge ${transfer.status === "COMPLETED" ? "status-paid" : "status-pending"}">${status}</span>`)}
    ${row("Sender", transfer.sender?.fullName || "—")}
    ${row("Receiver", transfer.receiver?.fullName || "—")}
    ${row("Sender Branch", transfer.branchLink?.senderBranch?.name || "—")}
    ${row("Receiver Branch", transfer.branchLink?.receiverBranch?.name || "—")}
    ${transfer.mobileProvider ? row("Provider", transfer.mobileProvider.name) : ""}
    ${row("Issued By", transfer.issuedBy?.name || "—")}
    ${row("Issued At", issuedAt)}
    ${transfer.paidBy ? row("Paid By", transfer.paidBy?.name || "—") : ""}
    ${transfer.paidAt ? row("Paid At", new Date(transfer.paidAt).toLocaleString()) : ""}
  </table>
  ${isReprint ? '<div class="reprint">⚠ REPRINT — Not original receipt</div>' : ""}
  <div class="footer">
    <p>This is a system-generated receipt from ${appName}.</p>
    <p>Please verify the secret code before releasing funds.</p>
  </div>
</div>
</body></html>`
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(request.url)
  const transferId = searchParams.get("transferId")
  const isReprint = searchParams.get("reprint") === "true"

  if (!transferId) {
    return NextResponse.json({ error: "transferId required" }, { status: 400 })
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      sender: true,
      receiver: true,
      issuedBy: { select: { name: true, role: true } },
      paidBy: { select: { name: true, role: true } },
      branchLink: {
        include: {
          senderBranch: { select: { name: true, city: true } },
          receiverBranch: { select: { name: true, city: true } },
        },
      },
      company: { select: { name: true, logo: true } },
      mobileProvider: { select: { name: true } },
    },
  })

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
  }

  if (transfer.companyId !== user.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const branchLink = transfer.branchLink
  if (!branchLink || (branchLink.senderBranchId !== user.branchId && branchLink.receiverBranchId !== user.branchId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      receiptPrintedAt: isReprint ? transfer.receiptPrintedAt : new Date(),
      receiptReprintedAt: isReprint ? new Date() : transfer.receiptReprintedAt,
    },
  })

  await logTransactionEvent({
    transferId,
    userId: user.id,
    action: isReprint ? "RECEIPT_REPRINTED" : "RECEIPT_PRINTED",
    details: `Receipt ${isReprint ? "reprinted" : "printed"} by ${user.name}`,
    branchId: user.branchId,
  })

  const html = generateReceiptHtml(transfer, user, isReprint)
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
