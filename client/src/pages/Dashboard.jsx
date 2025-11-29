"use client"
import { useEffect, useState } from "react"
import api from "../lib/api.js"
import { useAuth } from "../auth/auth-context.jsx"

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    currency: "USD",
    pendingApprovals: 0,
    pendingAmount: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
    teamMembers: 0,
    pendingList: [],
    recent: [],
  })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data } = await api.get("/api/stats")
        if (!active) return
        setStats(data)
      } catch (e) {
        // optionally toast
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => (active = false)
  }, [])

  const isManagerOrAdmin = user?.role === "MANAGER" || user?.role === "ADMIN"

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {user ? `Welcome, ${user.name}` : "Welcome"}
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed p-2 ">
          Track expenses, approvals, and your team's activity with clear multi-level workflows and flexible rules.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 ">
          <a href="/submit">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
              New Expense
            </button>
          </a>
          <a href="/my">
            <button className="px-6 py-3 bg-transparent text-blue-600 border border-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors w-full sm:w-auto">
              My Expenses
            </button>
          </a>
          {isManagerOrAdmin && (
            <a href="/approvals">
              <button className="px-6 py-3 bg-transparent text-blue-600 border border-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors w-full sm:w-auto">
                Pending Approvals
              </button>
            </a>
          )}
        </div>
      </div>

      {isManagerOrAdmin && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Pending approvals (amount)
              </h4>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-3xl font-bold text-gray-400 animate-pulse">…</p>
                ) : stats.pendingApprovals === 0 ? (
                  <p className="text-lg font-medium text-gray-400">No pending requests</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.pendingAmount.toFixed(2)} {stats.currency}
                    </p>
                    <p className="text-sm text-gray-500">
                      {stats.pendingApprovals} requests
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Total expenses
              </h4>
              <p className={`text-3xl font-bold ${loading ? 'text-gray-400 animate-pulse' : 'text-gray-900'}`}>
                {loading ? "…" : `${stats.totalAmount.toFixed(2)} ${stats.currency}`}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                This month
              </h4>
              <p className={`text-3xl font-bold ${loading ? 'text-gray-400 animate-pulse' : 'text-gray-900'}`}>
                {loading ? "…" : `${stats.thisMonthAmount.toFixed(2)} ${stats.currency}`}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Team members
              </h4>
              <p className={`text-3xl font-bold ${loading ? 'text-gray-400 animate-pulse' : 'text-gray-900'}`}>
                {loading ? "…" : stats.teamMembers}
              </p>
            </div>
          </div>

          {/* Pending Approvals Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <h4 className="bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
              Your pending approvals
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Step
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 animate-pulse">
                        Loading…
                      </td>
                    </tr>
                  ) : stats.pendingList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No pending approvals
                      </td>
                    </tr>
                  ) : (
                    stats.pendingList.map((e) => (
                      <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {e.employeeId?.name || e.employeeId || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {e.category || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {e.amount ? `${e.amount.value} ${e.amount.currency}` : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {e.currentStep}/{e.totalSteps}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Recent Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h4 className="bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
          Recent expenses
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 animate-pulse">
                    Loading…
                  </td>
                </tr>
              ) : stats.recent.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No recent expenses
                  </td>
                </tr>
              ) : (
                stats.recent.map((e) => (
                  <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {e.employeeId?.name || e.employeeId || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {e.category || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {e.amount ? `${e.amount.value} ${e.amount.currency}` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Table Cards - Hidden on larger screens */}
      <style jsx>{`
        @media (max-width: 640px) {
          .mobile-table {
            display: block !important;
          }
          .desktop-table {
            display: none !important;
          }
        }
        @media (min-width: 641px) {
          .mobile-table {
            display: none !important;
          }
          .desktop-table {
            display: table !important;
          }
        }
      `}</style>
    </div>
  )
}