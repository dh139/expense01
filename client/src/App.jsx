"use client"
import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./auth/auth-context.jsx"
import LoginSignup from "./pages/LoginSignup.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import SubmitExpense from "./pages/SubmitExpense.jsx"
import MyExpenses from "./pages/MyExpenses.jsx"
import PendingApprovals from "./pages/PendingApprovals.jsx"
import AdminUsers from "./pages/AdminUsers.jsx"
import AdminRules from "./pages/AdminRules.jsx"
import Records from "./pages/Records.jsx"
import { ToastProvider } from "./components/Toast.jsx"
import Footer from "./components/Footer.jsx"
import Profile from "./pages/Profile.jsx"
import Navbar from "./components/Navbar.jsx"

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function Shell({ children }) {
  return (
    <div>
      <header className="container">
        <Navbar />
      </header>
      <main className="container">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Shell>
          <Routes>
            <Route path="/" element={ <PrivateRoute roles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <Dashboard />
                </PrivateRoute>} />
            <Route path="/auth" element={<LoginSignup />} />
            <Route
              path="/submit"
              element={
                <PrivateRoute roles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <SubmitExpense />
                </PrivateRoute>
              }
            />
            <Route
              path="/my"
              element={
                <PrivateRoute roles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <MyExpenses />
                </PrivateRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <PrivateRoute roles={["MANAGER", "ADMIN"]}>
                  <PendingApprovals />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute roles={["ADMIN"]}>
                  <AdminUsers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/rules"
              element={
                <PrivateRoute roles={["ADMIN"]}>
                  <AdminRules />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/records"
              element={
                <PrivateRoute roles={["MANAGER", "ADMIN"]}>
                  <Records />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute roles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
        <Footer />
      </ToastProvider>
    </AuthProvider>
  )
}
