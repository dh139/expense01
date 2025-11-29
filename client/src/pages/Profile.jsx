"use client"

import { useEffect, useState } from "react"
import api from "../lib/api.js"
import { useToast } from "../components/Toast.jsx"
import { useAuth } from "../auth/auth-context.jsx"

export default function Profile() {
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", email: "" })
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data } = await api.get("/api/profile")
        if (!active) return
        setForm({ name: data.name || "", email: data.email || "" })
      } catch (e) {
        // no-op
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => (active = false)
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    try {
      const { data } = await api.patch("/api/profile", form)
      setForm({ name: data.name, email: data.email })
      toast({ title: "Profile updated", description: "Your profile has been saved.", type: "success" })
    } catch (e) {
      toast({ title: "Update failed", description: e.response?.data?.error || "Please try again", type: "error" })
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) {
      toast({ title: "Passwords do not match", type: "error" })
      return
    }
    try {
      await api.post("/api/profile/password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPw({ currentPassword: "", newPassword: "", confirm: "" })
      toast({ title: "Password changed", description: "Use your new password next time you log in.", type: "success" })
    } catch (e) {
      toast({ title: "Change failed", description: e.response?.data?.error || "Please try again", type: "error" })
    }
  }

  function initial() {
    const src = form.name || user?.name || user?.email || ""
    return (src.trim()[0] || "?").toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {initial()}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {form.name || user?.name || "Your Profile"}
                </h1>
                <p className="text-gray-500 text-sm md:text-base">
                  {form.email || user?.email || "email@example.com"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Forms */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Information
              </h2>
              <form onSubmit={saveProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50/50"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50/50"
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Save Profile
                </button>
              </form>
            </div>

            {/* Password Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </h2>
              <form onSubmit={changePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={pw.currentPassword}
                    onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50/50 pr-10"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={pw.newPassword}
                    onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50/50 pr-10"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={pw.confirm}
                    onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50/50 pr-10"
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Password Requirements Hint */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Password Requirements
        </h3>
        <p className="text-sm text-gray-600">
          Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
        </p>
      </div>
    </div>
  )
}