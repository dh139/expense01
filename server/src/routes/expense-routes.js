import express from "express"
import { body, validationResult } from "express-validator"
import multer from "multer"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { Expense } from "../models/expense.js"
import { Company } from "../models/company.js"
import { ApprovalRule } from "../models/approval-rule.js"
import { convertAmount } from "../services/currency-service.js"
import { extractReceipt } from "../services/ocr-service.js"
import { buildApproverList, evaluateConditionalRule } from "../services/approval-engine.js"
import { ROLES } from "../utils/roles.js"

const router = express.Router()
const upload = multer()

// GET /api/expenses?mine=true|false
router.get("/", requireAuth, async (req, res) => {
  const mine = req.query.mine === "true"
  const q = { companyId: req.user.companyId }
  if (mine) q.employeeId = req.user._id
  const expenses = await Expense.find(q).sort({ createdAt: -1 })
  res.json(expenses)
})

// POST /api/expenses - submit new expense
router.post(
  "/",
  requireAuth,
  body("amount").isFloat({ gt: 0 }),
  body("currency").notEmpty(),
  body("category").notEmpty(),
  body("date").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { amount, currency, category, description, date } = req.body

    const company = await Company.findById(req.user.companyId)
    const employee = req.user
    const rule = await ApprovalRule.findById(company.approvalRuleId)

    // convert
    let amountCompany = Number.parseFloat(amount)
    if (currency.toUpperCase() !== company.currencyCode.toUpperCase()) {
      amountCompany = await convertAmount(
        Number.parseFloat(amount),
        currency.toUpperCase(),
        company.currencyCode.toUpperCase(),
      )
    }

    // Build approver list
    const approverIds = await buildApproverList({ company, employee, rule })

    // Create approval records (all pending initially)
    const approvals = approverIds.map((id, idx) => ({
      approverId: id,
      step: idx + 1,
      status: idx === 0 ? "PENDING" : "PENDING",
      comment: "",
      decidedAt: null,
    }))

    const expense = await Expense.create({
      companyId: company._id,
      employeeId: employee._id,
      amountOriginal: Number.parseFloat(amount),
      currencyOriginal: currency.toUpperCase(),
      amountCompany,
      currencyCompany: company.currencyCode,
      category,
      description: description || "",
      date: new Date(date),
      approvals,
      currentStep: approvals.length > 0 ? 1 : 0,
      status: approvals.length > 0 ? "PENDING" : "APPROVED",
    })

    res.json(expense)
  },
)

// GET /api/expenses/pending - for approver inbox
router.get("/pending", requireAuth, requireRole(ROLES.MANAGER, ROLES.ADMIN), async (req, res) => {
  const expenses = await Expense.find({
    companyId: req.user.companyId,
    status: "PENDING",
    approvals: { $elemMatch: { approverId: req.user._id, status: "PENDING" } },
  }).sort({ createdAt: -1 })
  res.json(expenses)
})

// POST /api/expenses/:id/decision { action: 'APPROVE'|'REJECT', comment }
router.post("/:id/decision", requireAuth, requireRole(ROLES.MANAGER, ROLES.ADMIN), async (req, res) => {
  const { action, comment } = req.body
  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!expense) return res.status(404).json({ error: "Not found" })

  const current = expense.approvals.find((a) => a.step === expense.currentStep)
  if (!current || current.approverId.toString() !== req.user._id.toString() || current.status !== "PENDING") {
    return res.status(400).json({ error: "Not pending for you" })
  }

  current.status = action === "APPROVE" ? "APPROVED" : "REJECTED"
  current.comment = comment || ""
  current.decidedAt = new Date()

  const company = await Company.findById(expense.companyId)
  const rule = await ApprovalRule.findById(company.approvalRuleId)

  // Early approve if conditional rules pass (e.g., percent threshold or specific approver)
  const conditional = evaluateConditionalRule({ approvals: expense.approvals, rule })
  if (conditional === "APPROVED") {
    expense.status = "APPROVED"
    expense.currentStep = expense.approvals.length // finalize
  } else {
    // Otherwise, continue to next approver if any, regardless of approve/reject
    const hasNext = expense.currentStep < expense.approvals.length
    if (hasNext) {
      expense.currentStep += 1
      expense.status = "PENDING"
    } else {
      // No next approver. Finalize: approve if rules pass, else reject if any reject exists, else approve.
      const finalConditional = evaluateConditionalRule({ approvals: expense.approvals, rule })
      if (finalConditional === "APPROVED") {
        expense.status = "APPROVED"
      } else if (expense.approvals.some((a) => a.status === "REJECTED")) {
        expense.status = "REJECTED"
      } else {
        expense.status = "APPROVED"
      }
    }
  }

  await expense.save()
  res.json(expense)
})

// POST /api/expenses/ocr - upload receipt for OCR
router.post("/ocr", requireAuth, upload.single("receipt"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" })
  try {
    const result = await extractReceipt(req.file.buffer)
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "OCR failed" })
  }
})

export default router
