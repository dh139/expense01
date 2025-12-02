import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

function loadTemplate() {
  const file = path.resolve(__dirname, "../templates/reset-otp.html");
  return fs.readFileSync(file, "utf8");
}

function loadWelcomeTemplate() {
  const file = path.resolve(__dirname, "../templates/welcome-user.html");
  return fs.readFileSync(file, "utf8");
}

export async function sendResetOtpMail({ to, name, otp }) {
  const html = loadTemplate()
    .replace(/{{NAME}}/g, name || "there")
    .replace(/{{OTP}}/g, otp)
    .replace(/{{APP_NAME}}/g, process.env.APP_NAME || "Expense Reimbursement");

  const from =
    process.env.MAIL_FROM ||
    "noreply@yourdomain.com"; // Resend required format

  await resend.emails.send({
    from,
    to,
    subject: "Your password reset code",
    html,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
  email,
  password,
  companyName,
}) {
  const html = loadWelcomeTemplate()
    .replace(/{{APP_NAME}}/g, process.env.APP_NAME || "Expense Reimbursement")
    .replace(/{{NAME}}/g, name || "there")
    .replace(/{{COMPANY}}/g, companyName || "Your Company")
    .replace(/{{EMAIL}}/g, email)
    .replace(/{{PASSWORD}}/g, password);

  const from =
    process.env.MAIL_FROM ||
    "noreply@yourdomain.com"; // must match your Resend domain

  await resend.emails.send({
    from,
    to,
    subject: "Your account has been created",
    html,
  });
}
