"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light")
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem("theme", theme)
  }, [theme])
  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
