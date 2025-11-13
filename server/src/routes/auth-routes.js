import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import axios from "axios"
import { body, validationResult } from "express-validator"
import { Company } from "../models/company.js"
import { User } from "../models/user.js"
import { ApprovalRule } from "../models/approval-rule.js"
import { ROLES } from "../utils/roles.js"
import { sendResetOtpMail } from "../services/mail-service.js"

const router = express.Router()

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, companyId: user.companyId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  )
}

// POST /api/auth/signup
router.post(
  "/signup",
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("companyName").notEmpty(),
  body("country").notEmpty(), // full country name (for UX simplicity)
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { name, email, password, companyName, country } = req.body
    try {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) return res.status(400).json({ error: "Email already in use" })

      // Fetch country currencies
      const { data } = await axios.get("https://restcountries.com/v3.1/all?fields=name,currencies")
      const match = (data || []).find((c) => c?.name?.common?.toLowerCase() === country.toLowerCase())
      const currencyCode = match ? Object.keys(match.currencies || {})[0] : "USD"

      const company = await Company.create({
        name: companyName,
        country,
        currencyCode: currencyCode || "USD",
      })

      const passwordHash = await bcrypt.hash(password, 10)
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: ROLES.ADMIN,
        companyId: company._id,
      })

      // Default empty rule
      const rule = await ApprovalRule.create({ companyId: company._id, sequence: [] })
      company.approvalRuleId = rule._id
      await company.save()

      const token = signToken(user)
      res.json({ token, user: { id: user._id, name: user.name, role: user.role }, company })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: "Signup failed" })
    }
  },
)

// POST /api/auth/login
router.post("/login", body("email").isEmail(), body("password").isLength({ min: 6 }), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(400).json({ error: "Invalid credentials" })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(400).json({ error: "Invalid credentials" })
    const token = signToken(user)
    res.json({ token, user: { id: user._id, name: user.name, role: user.role }, companyId: user.companyId })
  } catch (err) {
    res.status(500).json({ error: "Login failed" })
  }
})

// POST /api/auth/forgot-password
router.post("/forgot-password", body("email").isEmail(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    // respond 200 even if user not found to avoid user enumeration
    if (!user) return res.json({ ok: true })

    const otp = String(Math.floor(100000 + Math.random() * 900000)) // 6 digits
    const resetOtpHash = await bcrypt.hash(otp, 10)
    user.resetOtpHash = resetOtpHash
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await user.save()

    await sendResetOtpMail({
      to: user.email,
      name: user.name,
      otp,
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Could not start reset" })
  }
})

// POST /api/auth/verify-otp
router.post("/verify-otp", body("email").isEmail(), body("otp").isLength({ min: 6, max: 6 }), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  try {
    const { email, otp } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ error: "Invalid code" })
    if (user.resetOtpExpires.getTime() < Date.now()) return res.status(400).json({ error: "Code expired" })

    const ok = await bcrypt.compare(otp, user.resetOtpHash)
    if (!ok) return res.status(400).json({ error: "Invalid code" })
    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Verification failed" })
  }
})

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  body("email").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  body("newPassword").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
      const { email, otp, newPassword } = req.body
      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ error: "Invalid code" })
      if (user.resetOtpExpires.getTime() < Date.now()) return res.status(400).json({ error: "Code expired" })

      const ok = await bcrypt.compare(otp, user.resetOtpHash)
      if (!ok) return res.status(400).json({ error: "Invalid code" })

      user.passwordHash = await bcrypt.hash(newPassword, 10)
      user.resetOtpHash = null
      user.resetOtpExpires = null
      await user.save()
      return res.json({ ok: true })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: "Reset failed" })
    }
  },
)

export default router
