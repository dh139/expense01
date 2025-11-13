import express from "express"
import { Expense } from "../models/expense.js"
import { Company } from "../models/company.js"
import { requireAuth  } from "../middleware/auth.js"
import pdf from "html-pdf-node"

const router = express.Router()

function normAmount(value, currency = "USD") {
  return { value: Number(value) || 0, currency }
}

function getRange(year, month) {
  if (month) {
    const [y, m] = month.split("-").map(Number)
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59, 999) }
  }
  if (year) {
    return { start: new Date(Number(year), 0, 1), end: new Date(Number(year), 11, 31, 23, 59, 59, 999) }
  }
  return null
}

router.get("/records", requireAuth , async (req, res) => {
  try {
    const { role, _id: userId, companyId } = req.user
    const { scope = "me", month = "", year = "" } = req.query
    const company = await Company.findById(companyId).lean()
    const currency = company?.currencyCode || "USD"

    const filter = { companyId }
    if (role === "EMPLOYEE" || scope === "me") filter.employeeId = userId
    const range = getRange(year, month)
    if (range) filter.createdAt = { $gte: range.start, $lte: range.end }

    const docs = await Expense.find(filter).populate("employeeId", "name email").sort({ createdAt: -1 }).lean()
    const rows = docs.map((e) => ({
      employee: e.employeeId?.name || "",
      email: e.employeeId?.email || "",
      category: e.category || "",
      status: e.status,
      createdAt: e.createdAt,
      amount: normAmount(e.amountCompany, e.currencyCompany || currency),
    }))
    
    // Only count approved expenses in total
    const total = rows.reduce((acc, r) => {
      return r.status === "APPROVED" ? acc + r.amount.value : acc
    }, 0)
    
    res.json({ currency, total, count: rows.length, rows })
  } catch (err) {
    console.error("[v0] /api/records error", err)
    res.status(500).json({ error: "Failed to load records" })
  }
})

router.get("/records/export", requireAuth , async (req, res) => {
  try {
    const { role, _id: userId, companyId } = req.user
    const { scope = "me", month = "", year = "" } = req.query
    const company = await Company.findById(companyId).lean()
    const currency = company?.currencyCode || "USD"
    const companyName = company?.name || "Company"

    const filter = { companyId }
    if (role === "EMPLOYEE" || scope === "me") filter.employeeId = userId
    const range = getRange(year, month)
    if (range) filter.createdAt = { $gte: range.start, $lte: range.end }

    const docs = await Expense.find(filter).populate("employeeId", "name email").sort({ createdAt: -1 }).lean()
    const rows = docs.map((e) => ({
      employee: e.employeeId?.name || "",
      email: e.employeeId?.email || "",
      category: e.category || "",
      status: e.status,
      createdAt: new Date(e.createdAt).toLocaleDateString(),
      amount: normAmount(e.amountCompany, e.currencyCompany || currency),
    }))
    
    // Separate approved and rejected expenses
    const approvedRows = rows.filter(r => r.status === "APPROVED")
    const pendingRows = rows.filter(r => r.status === "PENDING")
    const rejectedRows = rows.filter(r => r.status === "REJECTED")
    
    const approvedTotal = approvedRows.reduce((acc, r) => acc + r.amount.value, 0)
    const pendingTotal = pendingRows.reduce((acc, r) => acc + r.amount.value, 0)
    const rejectedTotal = rejectedRows.reduce((acc, r) => acc + r.amount.value, 0)

    const renderTable = (tableRows, title, totalAmount, statusColor) => {
      if (tableRows.length === 0) return ""
      
      return `
        <div class="section">
          <div class="section-header" style="background: ${statusColor};">
            <h2>${title}</h2>
            <div class="section-stats">
              <span class="stat-item">${tableRows.length} ${tableRows.length === 1 ? 'expense' : 'expenses'}</span>
              <span class="stat-divider">•</span>
              <span class="stat-item">${totalAmount.toFixed(2)} ${currency}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Category</th>
                <th>Date</th>
                <th class="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows
                .map(
                  (r) =>
                    `<tr>
                      <td><strong>${r.employee}</strong></td>
                      <td class="text-muted">${r.email}</td>
                      <td><span class="category-badge">${r.category}</span></td>
                      <td class="text-muted">${r.createdAt}</td>
                      <td class="amount-col"><strong>${r.amount.value.toFixed(2)} ${r.amount.currency}</strong></td>
                    </tr>`,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="total-label">Subtotal</td>
                <td class="amount-col total-amount">${totalAmount.toFixed(2)} ${currency}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${companyName} - Expense Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #1f2937;
              padding: 40px;
              background: #f9fafb;
              line-height: 1.6;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 32px;
              border-radius: 12px;
              margin-bottom: 32px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header h1 { 
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 12px;
              letter-spacing: -0.5px;
            }
            
            .header-meta {
              display: flex;
              gap: 24px;
              font-size: 14px;
              opacity: 0.95;
              flex-wrap: wrap;
            }
            
            .meta-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .meta-label {
              opacity: 0.8;
              font-weight: 500;
            }
            
            .meta-value {
              font-weight: 600;
              background: rgba(255, 255, 255, 0.2);
              padding: 4px 12px;
              border-radius: 6px;
            }
            
            .summary-card {
              background: white;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 32px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e5e7eb;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
            }
            
            .summary-item {
              text-align: center;
              padding: 16px;
              border-radius: 8px;
              background: #f9fafb;
            }
            
            .summary-item.approved { border-left: 4px solid #10b981; }
            .summary-item.pending { border-left: 4px solid #f59e0b; }
            .summary-item.rejected { border-left: 4px solid #ef4444; }
            
            .summary-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .summary-value {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
            }
            
            .summary-count {
              font-size: 13px;
              color: #6b7280;
              margin-top: 4px;
            }
            
            .section {
              background: white;
              border-radius: 12px;
              margin-bottom: 24px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e5e7eb;
            }
            
            .section-header {
              padding: 20px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: white;
            }
            
            .section-header h2 {
              font-size: 18px;
              font-weight: 600;
            }
            
            .section-stats {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 14px;
            }
            
            .stat-item {
              font-weight: 500;
            }
            
            .stat-divider {
              opacity: 0.6;
            }
            
            table { 
              width: 100%;
              border-collapse: collapse;
            }
            
            thead {
              background: #f9fafb;
            }
            
            th, td { 
              padding: 14px 24px;
              text-align: left;
              font-size: 13px;
            }
            
            th { 
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
              color: #6b7280;
            }
            
            tbody tr {
              border-bottom: 1px solid #f3f4f6;
            }
            
            tbody tr:hover {
              background: #f9fafb;
            }
            
            tbody tr:last-child {
              border-bottom: none;
            }
            
            .text-muted {
              color: #6b7280;
            }
            
            .category-badge {
              display: inline-block;
              padding: 4px 10px;
              background: #e0e7ff;
              color: #4338ca;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .amount-col {
              text-align: right;
            }
            
            tfoot {
              background: #f9fafb;
              border-top: 2px solid #e5e7eb;
            }
            
            tfoot td {
              padding: 16px 24px;
              font-weight: 600;
            }
            
            .total-label {
              color: #4b5563;
              font-size: 14px;
            }
            
            .total-amount {
              font-size: 16px;
              color: #1f2937;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 24px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            
            .footer-date {
              margin-bottom: 8px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyName}</h1>
            <div class="header-meta">
              <div class="meta-item">
                <span class="meta-label">Report Type:</span>
                <span class="meta-value">Expense Report</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Scope:</span>
                <span class="meta-value">${scope.toUpperCase()}</span>
              </div>
              ${month ? `<div class="meta-item"><span class="meta-label">Month:</span><span class="meta-value">${month}</span></div>` : ''}
              ${year ? `<div class="meta-item"><span class="meta-label">Year:</span><span class="meta-value">${year}</span></div>` : ''}
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-grid">
              <div class="summary-item approved">
                <div class="summary-label">Approved</div>
                <div class="summary-value">${approvedTotal.toFixed(2)} ${currency}</div>
                <div class="summary-count">${approvedRows.length} ${approvedRows.length === 1 ? 'expense' : 'expenses'}</div>
              </div>
              <div class="summary-item pending">
                <div class="summary-label">Pending</div>
                <div class="summary-value">${pendingTotal.toFixed(2)} ${currency}</div>
                <div class="summary-count">${pendingRows.length} ${pendingRows.length === 1 ? 'expense' : 'expenses'}</div>
              </div>
              <div class="summary-item rejected">
                <div class="summary-label">Rejected</div>
                <div class="summary-value">${rejectedTotal.toFixed(2)} ${currency}</div>
                <div class="summary-count">${rejectedRows.length} ${rejectedRows.length === 1 ? 'expense' : 'expenses'}</div>
              </div>
            </div>
          </div>
          
          ${renderTable(approvedRows, "✓ Approved Expenses", approvedTotal, "#10b981")}
          ${renderTable(pendingRows, "⏱ Pending Expenses", pendingTotal, "#f59e0b")}
          ${renderTable(rejectedRows, "✗ Rejected Expenses", rejectedTotal, "#ef4444")}
          
          <div class="footer">
            <div class="footer-date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>This is an automated report generated by ${companyName}</div>
          </div>
        </body>
      </html>
    `
    
    const file = { content: html }
    const pdfBuffer = await pdf.generatePdf(file, { 
      format: "A4", 
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    })
    
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="expense-report-${Date.now()}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    console.error("[v0] /api/records/export error", err)
    res.status(500).json({ error: "Failed to export PDF" })
  }
})

export default router