import express from "express"
import { Expense } from "../models/expense.js"
import { User } from "../models/user.js"
import { Company } from "../models/company.js"
import { requireAuth } from "../middleware/auth.js"


const router = express.Router()

router.get("/stats", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const userId = req.user._id
    const companyId = req.user.companyId
    const role = req.user.role

    if (!companyId) {
      return res.status(400).json({ error: "Company ID missing for user" })
    }

    // Fetch company details
    const company = await Company.findById(companyId).lean()
    const companyCurrency = company?.currencyCode || "USD"

    // --- Pending Approvals ---
    const pendingQuery = {
      companyId,
      approvals: { $elemMatch: { approverId: userId, status: "PENDING" } },
    }

    const pendingListRaw = await Expense.find(pendingQuery)
      .sort({ updatedAt: -1 })
      .limit(8)
      .select("_id employeeId category amountCompany currencyCompany status currentStep approvals createdAt")
      .populate("employeeId", "name email")
      .lean()

    const pendingList = pendingListRaw.map((e) => ({
      ...e,
      totalSteps: e.approvals?.length || 0,
      amount: {
        value: Number(e.amountCompany) || 0,
        currency: e.currencyCompany || companyCurrency,
      },
    }))

    const pendingApprovals = pendingList.length
    const pendingAmount = pendingList.reduce((acc, e) => acc + (e.amount.value || 0), 0)

    // --- Scope based on role ---
    const baseScope =
      ["ADMIN", "MANAGER"].includes(role)
        ? { companyId }
        : { companyId, employeeId: userId }

    // --- This Month ---
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [monthDocs, totalDocs, recentRaw, memberCount] = await Promise.all([
      Expense.find({ ...baseScope, createdAt: { $gte: firstOfMonth } })
        .select("amountCompany currencyCompany createdAt")
        .lean(),
      Expense.find(baseScope).select("amountCompany currencyCompany").lean(),
      Expense.find(baseScope)
        .sort({ createdAt: -1 })
        .limit(8)
        .select("_id employeeId category amountCompany currencyCompany status createdAt")
        .populate("employeeId", "name email")
        .lean(),
      User.countDocuments({ companyId, role: { $in: ["EMPLOYEE", "MANAGER"] } }),
    ])

    const thisMonthAmount = monthDocs.reduce((acc, e) => acc + (Number(e.amountCompany) || 0), 0)
    const totalAmount = totalDocs.reduce((acc, e) => acc + (Number(e.amountCompany) || 0), 0)

    const recent = recentRaw.map((e) => ({
      ...e,
      amount: {
        value: Number(e.amountCompany) || 0,
        currency: e.currencyCompany || companyCurrency,
      },
    }))

    return res.json({
      currency: companyCurrency,
      pendingApprovals,
      pendingAmount,
      totalAmount,
      thisMonthAmount,
      teamMembers: memberCount,
      pendingList,
      recent,
    })
  } catch (err) {
    console.error("[v0] /api/stats error:", err)
    return res.status(500).json({ error: "Failed to load stats" })
  }
})

export default router
