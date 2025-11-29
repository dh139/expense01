import express from "express"
import bcrypt from "bcryptjs"
import { requireAuth } from "../middleware/auth.js"
import { User } from "../models/user.js"

const router = express.Router()

router.get("/", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role companyId")
  res.json(user)
})

router.patch("/", requireAuth, async (req, res) => {
  const { name, email } = req.body
  const update = {}
  if (name) update.name = name
  if (email) {
    const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } })
    if (exists) return res.status(400).json({ error: "Email already in use" })
    update.email = email.toLowerCase()
  }
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select("name email role companyId")
  res.json(user)
})

router.post("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields" })
  const user = await User.findById(req.user.id)
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return res.status(400).json({ error: "Current password incorrect" })
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()
  res.json({ success: true })
})

export default router
