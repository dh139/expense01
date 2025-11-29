"use client"

import { createContext, useContext, useEffect, useState } from "react"
import api from "../lib/api.js"

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null)
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) api.setToken(token)
  }, [token])

  function login(data) {
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return <AuthCtx.Provider value={{ token, user, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
