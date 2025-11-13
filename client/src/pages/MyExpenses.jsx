import { useEffect, useState } from "react"
import api from "../lib/api.js"

export default function MyExpenses() {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/api/expenses?mine=true")
      setItems(data)
    }
    load()
  }, [])

  return (
    <div className="card">
      <h3>My Expenses</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((x) => (
            <tr key={x._id}>
              <td>{new Date(x.date).toLocaleDateString()}</td>
              <td>{x.category}</td>
              <td>
                {x.amountOriginal} {x.currencyOriginal}{" "}
                <span className="badge">
                  ≈ {x.amountCompany.toFixed(2)} {x.currencyCompany}
                </span>
              </td>
              <td>
                {x.status === "APPROVED" && <span className="badge success">APPROVED</span>}
                {x.status === "REJECTED" && <span className="badge danger">REJECTED</span>}
                {x.status === "PENDING" && <span className="badge">PENDING</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
