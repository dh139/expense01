import express from "express"
import { body, validationResult } from "express-validator"
import bcrypt from "bcryptjs"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { User } from "../models/user.js"
import { Company } from "../models/company.js"
import { ROLES, ALL_ROLES } from "../utils/roles.js"
import { sendWelcomeEmail } from "../services/mail-service.js" // add import

const router = express.Router()

// GET /api/users - list company users (admin)
router.get("/", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const users = await User.find({ companyId: req.user.companyId }).select("-passwordHash")
  res.json(users)
})

// POST /api/users - create user (admin)
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.ADMIN),
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(ALL_ROLES),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { name, email, password, role, managerId } = req.body
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(400).json({ error: "Email already in use" })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      managerId: managerId || null,
      companyId: req.user.companyId,
    })

    try {
      const company = await Company.findById(req.user.companyId).select("name")
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
        email: user.email,
        password, // intentionally send the initial password once
        companyName: company?.name || "Your Company",
      })
    } catch (e) {
      // avoid blocking UI if email fails
      console.error("[v0] Welcome email failed:", e.message)
    }

    res.json({ id: user._id, name: user.name, role: user.role })
  },
)

// PATCH /api/users/:id - update role/manager (admin)
router.patch("/:id", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { role, managerId } = req.body
  const update = {}
  if (role) update.role = role
  if (managerId !== undefined) update.managerId = managerId
  const user = await User.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, update, {
    new: true,
  }).select("-passwordHash")
  res.json(user)
})

// PATCH /api/users/company/settings - toggle manager approver (admin)
router.patch("/company/settings", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { managerApproverEnabled } = req.body
  const company = await Company.findById(req.user.companyId)
  if (!company) return res.status(404).json({ error: "Company not found" })
  if (typeof managerApproverEnabled === "boolean") {
    company.managerApproverEnabled = managerApproverEnabled
  }
  await company.save()
  res.json(company)
})

export default router
