import { useEffect, useState } from "react"
import api from "../lib/api.js"

export default function PendingApprovals() {
  const [items, setItems] = useState([])
  const [comment, setComment] = useState({})

  async function load() {
    const { data } = await api.get("/api/expenses/pending")
    setItems(data)
  }
  useEffect(() => {
    load()
  }, [])

  async function decide(id, action) {
    await api.post(`/api/expenses/${id}/decision`, {
      action: action === "approve" ? "APPROVE" : "REJECT",
      comment: comment[id] || "",
    })
    await load()
  }

  return (
    <div className="card">
      <h3>Pending Approvals</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Step</th>
            <th>Decide</th>
          </tr>
        </thead>
        <tbody>
          {items.map((x) => (
            <tr key={x._id}>
              <td>{x.employeeId}</td>
              <td>{x.category}</td>
              <td>
                {x.amountCompany.toFixed(2)} {x.currencyCompany}
              </td>
              <td>
                {x.currentStep}/{x.approvals.length}
              </td>
              <td>
                <input
                  placeholder="Comment"
                  value={comment[x._id] || ""}
                  onChange={(e) => setComment({ ...comment, [x._id]: e.target.value })}
                />
                <button onClick={() => decide(x._id, "approve")} style={{ marginLeft: 8 }}>
                  Approve
                </button>
                <button onClick={() => decide(x._id, "reject")} style={{ marginLeft: 8, background: "var(--danger)" }}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
