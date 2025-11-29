"use client"

import { useState } from "react"
import api from "../lib/api.js"
import { useAuth } from "../auth/auth-context.jsx"
import { Navigate, useNavigate } from "react-router-dom"
import { useToast } from "../components/Toast.jsx"

export default function LoginSignup() {
  const { login, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState("login")
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    country: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotStep, setForgotStep] = useState("email") // 'email' | 'verify'
  const [reset, setReset] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" })

  if (user) return <Navigate to="/" replace />

  async function requestReset(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/api/auth/forgot-password", { email: reset.email })
      toast({ title: "Check your inbox", description: "We sent a 6-digit code." })
      setForgotStep("verify")
    } catch (e) {
      const msg = e?.response?.data?.error || "Could not start reset"
      setError(msg)
      toast({ title: "Error", description: msg, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  async function submitReset(e) {
    e.preventDefault()
    setError("")
    if (reset.newPassword !== reset.confirmPassword) {
      return toast({ title: "Passwords don't match", description: "Please confirm the new password.", type: "error" })
    }
    setLoading(true)
    try {
      await api.post("/api/auth/reset-password", {
        email: reset.email,
        otp: reset.otp,
        newPassword: reset.newPassword,
      })
      toast({ title: "Password updated", description: "You can now sign in with your new password." })
      setForgotMode(false)
      setForgotStep("email")
      setReset({ email: "", otp: "", newPassword: "", confirmPassword: "" })
    } catch (e) {
      const msg = e?.response?.data?.error || "Reset failed"
      setError(msg)
      toast({ title: "Reset failed", description: msg, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (mode === "login") {
        const { data } = await api.post("/api/auth/login", { email: form.email, password: form.password })
        login(data)
        toast({ title: "Welcome back!", description: "You are now signed in." })
      } else {
        const { data } = await api.post("/api/auth/signup", {
          name: form.name,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          country: form.country,
        })
        login(data)
        toast({ title: "Account created", description: "Company and admin user set up." })
      }
      navigate("/", { replace: true })
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed"
      setError(msg)
      toast({ title: "Authentication failed", description: msg, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{mode === "login" ? "Login" : "Sign up"}</h3>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account?" : "Have an account?"}
        </button>
      </div>
      {error && <p style={{ color: "salmon" }}>{error}</p>}
      <form onSubmit={submit} className="grid" style={{ marginTop: 16 }}>
        {mode === "signup" && (
          <>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Company Name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <input
              placeholder="Country (e.g. United States)"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
            />
          </>
        )}
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
      </form>
      <p style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
        Signup auto-creates a Company (currency based on country) and Admin user.
      </p>

      {!forgotMode && (
        <p style={{ marginTop: 8 }}>
          <button type="button" onClick={() => setForgotMode(true)} className="link">
            Forgot password?
          </button>
        </p>
      )}

      {forgotMode && (
        <div className="grid" style={{ marginTop: 16 }}>
          {forgotStep === "email" && (
            <form onSubmit={requestReset} className="grid">
              <input
                placeholder="Your account email"
                type="email"
                value={reset.email}
                onChange={(e) => setReset({ ...reset, email: e.target.value })}
                required
              />
              <div className="row" style={{ gap: 8 }}>
                <button disabled={loading}>{loading ? "Sending..." : "Send code"}</button>
                <button type="button" onClick={() => setForgotMode(false)} className="secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {forgotStep === "verify" && (
            <form onSubmit={submitReset} className="grid">
              <input
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                value={reset.otp}
                onChange={(e) => setReset({ ...reset, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                required
              />
              <input
                placeholder="New password"
                type="password"
                value={reset.newPassword}
                onChange={(e) => setReset({ ...reset, newPassword: e.target.value })}
                required
              />
              <input
                placeholder="Confirm new password"
                type="password"
                value={reset.confirmPassword}
                onChange={(e) => setReset({ ...reset, confirmPassword: e.target.value })}
                required
              />
              <div className="row" style={{ gap: 8 }}>
                <button disabled={loading}>{loading ? "Updating..." : "Reset password"}</button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep("email")
                  }}
                  className="secondary"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
