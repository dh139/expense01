import { useEffect, useState } from "react"
import api from "../lib/api.js"

export default function AdminRules() {
  const [rule, setRule] = useState({ sequence: [], percentThreshold: null, specificApprovers: [], hybridOr: true })
  const [users, setUsers] = useState([])
  const [newSeq, setNewSeq] = useState({ type: "ROLE", value: "MANAGER" })

  async function load() {
    const [r, u] = await Promise.all([api.get("/api/rules"), api.get("/api/users")])
    setRule(r.data || { sequence: [], percentThreshold: null, specificApprovers: [], hybridOr: true })
    setUsers(u.data)
  }
  useEffect(() => {
    load()
  }, [])

  function addSeq() {
    setRule((prev) => ({ ...prev, sequence: [...prev.sequence, newSeq] }))
    setNewSeq({ type: "ROLE", value: "MANAGER" }) // Reset after adding
  }

  function removeSeq(idx) {
    setRule((prev) => ({ ...prev, sequence: prev.sequence.filter((_, i) => i !== idx) }))
  }

  async function save() {
    await api.post("/api/rules", rule)
    alert("Rules saved successfully")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Approval Rules Management</h2>

      {/* Approval Sequence Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Approval Sequence</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
<select
  value={newSeq.type}
  onChange={(e) => setNewSeq({ ...newSeq, type: e.target.value })}
  className="border rounded-md p-2 bg-blue-600 text-white border-blue-700 
             focus:outline-none focus:ring-2 focus:ring-blue-400"
>
  <option value="ROLE">Role</option>
  <option value="USER">User</option>
</select>

          {newSeq.type === "ROLE" ? (
            <select
              value={newSeq.value}
              onChange={(e) => setNewSeq({ ...newSeq, value: e.target.value })}
              className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["MANAGER", "ADMIN", "EMPLOYEE"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={newSeq.value}
              onChange={(e) => setNewSeq({ ...newSeq, value: e.target.value })}
              className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={addSeq}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Step
          </button>
        </div>
        {rule.sequence.length > 0 ? (
          <ol className="list-decimal pl-5 space-y-2">
            {rule.sequence.map((s, idx) => (
              <li key={idx} className="flex items-center justify-between py-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Step {idx + 1}: {s.type} - {s.type === "ROLE" ? s.value : users.find(u => u._id === s.value)?.name || s.value}
                </span>
                <button
                  onClick={() => removeSeq(idx)}
                  className="text-red-500 hover:text-red-600 font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No sequence steps defined.</p>
        )}
      </div>

      {/* Conditional Rules Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Conditional Rules</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Percent Threshold
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Enter percent threshold (e.g., 60)"
              value={rule.percentThreshold ?? ""}
              onChange={(e) =>
                setRule({ ...rule, percentThreshold: e.target.value ? Number.parseFloat(e.target.value) : null })
              }
              className="w-full max-w-xs border rounded-md p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Specific Approvers
            </label>
            <select
              multiple
              value={rule.specificApprovers}
              onChange={(e) =>
                setRule({ ...rule, specificApprovers: Array.from(e.target.selectedOptions).map((o) => o.value) })
              }
              className="w-full max-w-md border rounded-md p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              size="5"
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={rule.hybridOr}
              onChange={(e) => setRule({ ...rule, hybridOr: e.target.checked })}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">Hybrid OR mode (otherwise AND)</span>
          </label>
        </div>
        <button
          onClick={save}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Save Rules
        </button>
      </div>
    </div>
  )
}