"use client"

import { useState, useMemo } from "react"
import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../auth/auth-context.jsx"
import { Menu, X } from "lucide-react"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const initial = useMemo(() => {
    if (!user) return "U"
    const src = user.name || user.email || ""
    return (src.trim()[0] || "U").toUpperCase()
  }, [user])

  const closeMenu = () => setOpen(false)

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div className="brand">
          <span className="badge">E</span>
          <Link to="/" className="brand-text">
            Expense
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="nav-menu desktop">
          <NavLink to="/" end className="nav-link" onClick={closeMenu}>
            Dashboard
          </NavLink>
          <NavLink to="/submit" className="nav-link" onClick={closeMenu}>
            Submit Expense
          </NavLink>
          <NavLink to="/approvals" className="nav-link" onClick={closeMenu}>
            Approvals
          </NavLink>
          <NavLink to="/my" className="nav-link" onClick={closeMenu}>
            History
          </NavLink>
          {user?.role === "ADMIN" && (
            <>
              <NavLink to="/admin/users" className="nav-link" onClick={closeMenu}>
                Users
              </NavLink>
              <NavLink to="/admin/rules" className="nav-link" onClick={closeMenu}>
                Rules
              </NavLink>
               <NavLink to="/admin/records" className="nav-link" onClick={closeMenu}>
                Records
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          <button
            className="hamburger"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/profile" title="Profile" className="avatar" aria-label="Profile">
            {initial}
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      <nav className={`nav-menu mobile ${open ? "open" : ""}`}>
        <NavLink to="/" end className="nav-link" onClick={closeMenu}>
          Dashboard
        </NavLink>
        <NavLink to="/submit" className="nav-link" onClick={closeMenu}>
          Submit Expense
        </NavLink>
        <NavLink to="/approvals" className="nav-link" onClick={closeMenu}>
          Approvals
        </NavLink>
        <NavLink to="/my" className="nav-link" onClick={closeMenu}>
          History
        </NavLink>
        {user?.role === "ADMIN" && (
          <>
            <NavLink to="/admin/users" className="nav-link" onClick={closeMenu}>
              Users
            </NavLink>
            <NavLink to="/admin/rules" className="nav-link" onClick={closeMenu}>
              Rules
            </NavLink>
             <NavLink to="/admin/records" className="nav-link" onClick={closeMenu}>
              Records
            </NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
