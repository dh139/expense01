import express from "express"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { Company } from "../models/company.js"
import { ApprovalRule } from "../models/approval-rule.js"
import { ROLES } from "../utils/roles.js"

const router = express.Router()

// GET /api/rules - get company rule
router.get("/", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const company = await Company.findById(req.user.companyId)
  const rule = await ApprovalRule.findById(company.approvalRuleId).lean()
  res.json(rule)
})

// POST /api/rules - replace rule
router.post("/", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { sequence = [], percentThreshold = null, specificApprovers = [], hybridOr = true } = req.body
  const company = await Company.findById(req.user.companyId)
  const rule = await ApprovalRule.findByIdAndUpdate(
    company.approvalRuleId,
    { sequence, percentThreshold, specificApprovers, hybridOr },
    { new: true },
  )
  res.json(rule)
})

export default router
