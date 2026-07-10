import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null
let configured = false

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) {
    console.warn("[email] SMTP not configured — email delivery disabled. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env")
    return null
  }
  try {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: { user, pass },
    })
    configured = true
    return transporter
  } catch (err) {
    console.warn("[email] Failed to create transporter:", err)
    return null
  }
}

function getFromAddress(): string {
  return process.env.SMTP_USER || "noreply@trustbank360.com"
}

function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || "TrustBank360"
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter()
  if (!t) {
    console.log("[email] WOULD SEND:", { to, subject, html: html.substring(0, 200) + "..." })
    return
  }
  try {
    await t.sendMail({ from: `"${getAppName()}" <${getFromAddress()}>`, to, subject, html })
    console.log(`[email] Sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err)
  }
}

export function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  return sendMail(
    email,
    "Reset Your Password",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0F4C81;">${getAppName()}</h2>
      <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0F4C81;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a>
      <p style="color:#666;font-size:12px;">If you didn't request this, ignore this email. No changes have been made to your account.</p>
    </div>`
  )
}

export function sendWelcomeEmail(email: string, name: string, tempPassword: string): Promise<void> {
  return sendMail(
    email,
    `Welcome to ${getAppName()}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0F4C81;">Welcome to ${getAppName()}, ${name}!</h2>
      <p>Your account has been created. Use the temporary password below to sign in. You'll be asked to set a new password on first login.</p>
      <div style="background:#f5f5f5;padding:12px 16px;border-radius:8px;font-family:monospace;font-size:18px;text-align:center;margin:16px 0;letter-spacing:2px;">${tempPassword}</div>
      <p style="color:#666;font-size:12px;">For security, please change this password immediately after logging in.</p>
    </div>`
  )
}

export function sendCampaignEmail(email: string, subject: string, content: string): Promise<void> {
  return sendMail(
    email,
    subject,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      ${content}
      <hr style="margin-top:24px;" />
      <p style="color:#999;font-size:11px;">You're receiving this because you subscribed to ${getAppName()} updates. If you'd like to unsubscribe, reply to this email.</p>
    </div>`
  )
}

export function sendSupportReplyEmail(email: string, subject: string, reply: string): Promise<void> {
  return sendMail(
    email,
    `Re: ${subject}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0F4C81;">${getAppName()} Support</h2>
      <p>Your support request <strong>${subject}</strong> has received a reply:</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;">${reply}</div>
      <p style="color:#666;font-size:12px;">If you have further questions, please reply to this email or submit a new request.</p>
    </div>`
  )
}

export function isEmailConfigured(): boolean {
  return !!getTransporter()
}
