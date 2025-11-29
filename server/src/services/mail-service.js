import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  })
}

function loadTemplate() {
  const file = path.resolve(__dirname, "../templates/reset-otp.html")
  return fs.readFileSync(file, "utf8")
}

function loadWelcomeTemplate() {
  const file = path.resolve(__dirname, "../templates/welcome-user.html")
  return fs.readFileSync(file, "utf8")
}

export async function sendResetOtpMail({ to, name, otp }) {
  const transporter = getTransport()
  const html = loadTemplate()
    .replace(/{{NAME}}/g, name || "there")
    .replace(/{{OTP}}/g, otp)
    .replace(/{{APP_NAME}}/g, process.env.APP_NAME || "Expense Reimbursement")

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@example.com"
  await transporter.sendMail({
    from,
    to,
    subject: "Your password reset code",
    html,
  })
}

export async function sendWelcomeEmail({ to, name, email, password, companyName }) {
  const transporter = getTransport()
  const html = loadWelcomeTemplate()
    .replace(/{{APP_NAME}}/g, process.env.APP_NAME || "Expense Reimbursement")
    .replace(/{{NAME}}/g, name || "there")
    .replace(/{{COMPANY}}/g, companyName || "Your Company")
    .replace(/{{EMAIL}}/g, email)
    .replace(/{{PASSWORD}}/g, password)

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@example.com"
  await transporter.sendMail({
    from,
    to,
    subject: "Your account has been created",
    html,
  })
}
