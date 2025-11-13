import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
})

// ✅ define setToken first
api.setToken = (token) => {
  api.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : ""
}

// ✅ then call it if token exists
const existing = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null
if (existing) {
  api.setToken(existing)
}

export function getStats() {
  return api.get("/api/stats")
}

export function getRecords(params = {}) {
  return api.get("/api/records", { params })
}

export function exportRecordsPdf(params = {}) {
  return api.get("/api/records/export", { params, responseType: "arraybuffer" })
}

export default api
