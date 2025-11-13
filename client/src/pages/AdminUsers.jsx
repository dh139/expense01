"use client"

import { useEffect, useState } from "react"
import api from "../lib/api.js"
import { useToast } from "../components/Toast.jsx"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    managerId: "",
    emailCredentials: true,
  })
  const [settings, setSettings] = useState({ managerApproverEnabled: true })
  const { toast } = useToast()

  async function load() {
    const { data } = await api.get("/api/users")
    setUsers(data)
  }
  useEffect(() => {
    load()
  }, [])

  async function createUser(e) {
    e.preventDefault()
    await api.post("/api/users", {
      ...form,
      managerId: form.managerId || null,
      emailCredentials: form.emailCredentials,
    })
    toast({
      title: "User created",
      description: form.emailCredentials ? "Credentials have been emailed to the user." : "User created without email.",
      type: "success",
    })
    setForm({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "", emailCredentials: true })
    await load()
  }

  async function saveSettings() {
    await api.patch("/api/users/company/settings", settings)
    toast({ title: "Settings saved", description: "Company approval preferences updated.", type: "success" })
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h3>Company Settings</h3>
        <label className="row" style={{ alignItems: "center" }}>
          <input
            type="checkbox"
            checked={settings.managerApproverEnabled}
            onChange={(e) => setSettings({ ...settings, managerApproverEnabled: e.target.checked })}
          />
          <span style={{ marginLeft: 8 }}>Require Manager as first approver</span>
        </label>
        <button onClick={saveSettings} style={{ marginTop: 8 }}>
          Save
        </button>
      </div>

      <div className="card">
        <h3>Create User</h3>
        <form onSubmit={createUser} className="grid grid-2">
          <label>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Name
            </div>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Email
            </div>
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Temporary Password
            </div>
            <input
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Role
            </div>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {["EMPLOYEE", "MANAGER", "ADMIN"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Manager (optional)
            </div>
            <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
              <option value="">No Manager</option>
              {users
                .filter((u) => u.role !== "EMPLOYEE")
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </label>
          <label className="row" style={{ alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.emailCredentials}
              onChange={(e) => setForm({ ...form, emailCredentials: e.target.checked })}
            />
            <span style={{ marginLeft: 8 }}>Email credentials to user</span>
          </label>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button>Create</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Users</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Manager</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className=" info">{u.role}</span>
                </td>
                <td>{u.managerName || u.managerId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
