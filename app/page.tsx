export default function Page() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px" }}>
      <h1 style={{ marginBottom: 8 }}>Expense Approval MERN</h1>
      <p style={{ opacity: 0.8 }}>
        This Next.js page exists only to satisfy the preview. Your full MERN app lives in the <code>server/</code> and{" "}
        <code>client/</code> folders.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>How to run locally</h2>
        <ol>
          <li style={{ marginTop: 8 }}>
            Server
            <ul>
              <li>cd server</li>
              <li>Copy .env.example to .env and set MONGO_URI, JWT_SECRET</li>
              <li>npm install</li>
              <li>npm run dev (starts on http://localhost:5000)</li>
            </ul>
          </li>
          <li style={{ marginTop: 8 }}>
            Client
            <ul>
              <li>cd client</li>
              <li>Copy .env.example to .env (VITE_API_BASE=http://localhost:5000)</li>
              <li>npm install</li>
              <li>npm run dev (opens http://localhost:5173)</li>
            </ul>
          </li>
        </ol>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Features Included</h2>
        <ul>
          <li>Auth (JWT), Company auto-create with country currency</li>
          <li>Roles: Admin, Manager, Employee; manager relationships</li>
          <li>Expense submission with multi-currency conversion</li>
          <li>Approval sequence + conditional rules (percent threshold, specific approvers, hybrid OR/AND)</li>
          <li>OCR-assisted receipt parsing (tesseract.js)</li>
        </ul>
      </section>
    </main>
  )
}
