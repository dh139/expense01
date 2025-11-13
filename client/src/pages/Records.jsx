"use client"

import { useEffect, useState } from "react"
import { getRecords, exportRecordsPdf } from "../lib/api.js"
import { useAuth } from "../auth/auth-context.jsx"
import { ToastProvider, useToast } from "../components/Toast.jsx" // Assuming useToast is exported

export default function Records() {
  const { toast } = useToast() // Use the hook for toasts
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === "MANAGER" || user?.role === "ADMIN"
  const [scope, setScope] = useState(isManagerOrAdmin ? "company" : "me")
  const [month, setMonth] = useState("") // YYYY-MM
  const [year, setYear] = useState("") // YYYY
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ currency: "USD", total: 0, count: 0, rows: [] })

  async function load() {
    setLoading(true)
    try {
      const { data: apiData } = await getRecords({ scope, month, year })
      setData(apiData)
    } catch (e) {
      toast({ title: "Failed to load records", type: "error" })
      console.error("[v0] records load error", e?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, month, year])

  async function exportPdf() {
    try {
      const res = await exportRecordsPdf({ scope, month, year })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "expense-report.pdf"
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Exported PDF", type: "success" })
    } catch (e) {
      toast({ title: "Export failed", type: "error" })
      console.error("[v0] export pdf error", e?.message)
    }
  }

  return (
    <ToastProvider>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Expense Records</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {isManagerOrAdmin && <option value="company">Company</option>}
                {isManagerOrAdmin && <option value="team">Team</option>}
                <option value="me">Me</option>
              </select>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-24"
              />
              <button
                onClick={exportPdf}
                className="px-4 py-2 bg-transparent text-indigo-600 border border-indigo-600 rounded-md font-medium hover:bg-indigo-50 transition-colors"
              >
                Export PDF
              </button>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            Total: {loading ? <span className="animate-pulse">…</span> : `${data.total.toFixed(2)} ${data.currency}`} · Count: {loading ? <span className="animate-pulse">…</span> : data.count}
          </p>
        </div>

        {/* Records Table Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 animate-pulse">
                      Loading…
                    </td>
                  </tr>
                ) : data.rows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No records
                    </td>
                  </tr>
                ) : (
                  data.rows.map((r, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.employee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          r.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{`${r.amount.value} ${r.amount.currency}`}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </ToastProvider>
  )
}