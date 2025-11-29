"use client"

import { createContext, useContext, useMemo, useState } from "react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  function toast({ title, description, type = "success", id }) {
    const item = { id: id || crypto.randomUUID(), title, description, type }
    setItems((prev) => [...prev, item])
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== item.id)), 3500)
  }
  const value = useMemo(() => ({ toast }), [])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-title">{t.title}</div>
            {t.description && <div className="toast-desc">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
