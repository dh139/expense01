export default function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>© {new Date().getFullYear()} Expense Manager</span>
        <nav style={{ display: "flex", gap: 12 }}>
          <a href="#" aria-label="Docs">
            Docs
          </a>
          <a href="#" aria-label="Privacy">
            Privacy
          </a>
          <a href="#" aria-label="Support">
            Support
          </a>
        </nav>
      </div>
    </footer>
  )
}
