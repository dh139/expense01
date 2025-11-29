import { User } from "../models/user.js"

export async function buildApproverList({ company, employee, rule }) {
  const approvers = []

  // Optional manager approver as first step
  if (company.managerApproverEnabled && employee.managerId) {
    approvers.push(employee.managerId.toString())
  }

  // Sequence from rule
  for (const step of rule.sequence || []) {
    if (step.type === "ROLE") {
      const roleUsers = await User.find({ companyId: company._id, role: step.value })
      roleUsers.forEach((u) => approvers.push(u._id.toString()))
    } else if (step.type === "USER") {
      approvers.push(step.value.toString())
    }
  }

  // Deduplicate while preserving order
  const seen = new Set()
  const ordered = []
  for (const id of approvers) {
    if (!seen.has(id)) {
      seen.add(id)
      ordered.push(id)
    }
  }
  return ordered
}

// Evaluate conditional rules on the fly
export function evaluateConditionalRule({ approvals, rule }) {
  if (!rule) return null // no decision
  const total = approvals.length
  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length
  const specificIds = (rule.specificApprovers || []).map((x) => x.toString())
  const hasSpecificApproved = approvals.some(
    (a) => a.status === "APPROVED" && specificIds.includes(a.approverId.toString()),
  )
  const percentApproved = total > 0 ? (approvedCount / total) * 100 : 0

  const percentPass = rule.percentThreshold != null ? percentApproved >= rule.percentThreshold : null
  const specificPass = specificIds.length > 0 ? hasSpecificApproved : null

  // hybrid OR/AND semantics
  if (rule.hybridOr) {
    if (percentPass === true || specificPass === true) return "APPROVED"
  } else {
    if ((percentPass !== null ? percentPass : true) && (specificPass !== null ? specificPass : true)) return "APPROVED"
  }
  return null
}
