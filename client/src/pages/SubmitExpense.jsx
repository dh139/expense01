import { useEffect, useState } from "react"
import api from "../lib/api.js"
import { useToast } from "../components/Toast.jsx"

export default function SubmitExpense() {
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  })
  const [rates, setRates] = useState({})
  const [file, setFile] = useState(null)
  const [ocrText, setOcrText] = useState("")
  const [showOCR, setShowOCR] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/api/utils/rates/USD`)
        setRates(data)
      } catch {}
    }
    load()
  }, [])

  async function handleOCR() {
    if (!file) return
    const fd = new FormData()
    fd.append("receipt", file)
    try {
      const { data } = await api.post("/api/expenses/ocr", fd)
      setOcrText(data.rawText || "")
      setForm((prev) => ({
        ...prev,
        amount: data.amount != null ? String(data.amount) : prev.amount,
        description: data.description || prev.description,
        date: data.date ? data.date.split("T")[0] : prev.date,
      }))
      setShowOCR(true)
      toast({ title: "OCR complete", description: "We filled in details from your receipt." })
    } catch (e) {
      toast({ title: "OCR failed", description: "Please try a clearer photo.", type: "error" })
    }
  }

  async function submit(e) {
    e.preventDefault()
    try {
      await api.post("/api/expenses", {
        amount: Number.parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        description: form.description,
        date: form.date,
      })
      toast({ title: "Expense submitted", description: "We sent it for approval." })
      setForm({
        amount: "",
        currency: form.currency,
        category: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      })
      setFile(null)
      setOcrText("")
      setShowOCR(false)
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to submit"
      toast({ title: "Submission failed", description: msg, type: "error" })
    }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Submit Expense</h3>
        <form onSubmit={submit} className="grid" style={{ gap: 12 }}>
          <div className="row" style={{ alignItems: "center" }}>
            <label style={{ width: 0, position: "absolute", opacity: 0 }} htmlFor="amount">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <label style={{ width: 0, position: "absolute", opacity: 0 }} htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <label style={{ width: 0, position: "absolute", opacity: 0 }} htmlFor="category">
            Category
          </label>
          <input
            id="category"
            placeholder="Category (e.g. Meals, Travel)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
          <label style={{ width: 0, position: "absolute", opacity: 0 }} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows="3"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label style={{ width: 0, position: "absolute", opacity: 0 }} htmlFor="date">
            Date
          </label>
          <input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <input
              aria-label="Upload receipt image or PDF"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="ghost-btn" onClick={() => setShowOCR((s) => !s)}>
                {showOCR ? "Hide OCR" : "Show OCR"}
              </button>
              <button type="button" onClick={handleOCR}>
                OCR Autofill
              </button>
            </div>
          </div>
          {showOCR && (
            <pre className="card" style={{ whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
              {ocrText || "No OCR extracted yet."}
            </pre>
          )}
          <button type="submit">Submit</button>
        </form>
      </div>

      <div className="card">
        <h4 style={{ marginTop: 0 }}>Tip: Sample Receipt Reference</h4>
        <p className="text-pretty">Use clear, well-lit photos for better OCR. Here’s an example similar to yours:</p>
        <img
          src="/images/food-bill-anandha-bavan.jpg"
          alt="Sample restaurant receipt with items and total near Rs. 404.00"
          style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid var(--muted)" }}
        />
      </div>
    </div>
  )
}
