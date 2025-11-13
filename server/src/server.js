import "dotenv/config"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import { connectDB } from "./config/db.js"
import authRoutes from "./routes/auth-routes.js"
import userRoutes from "./routes/user-routes.js"
import expenseRoutes from "./routes/expense-routes.js"
import ruleRoutes from "./routes/rule-routes.js"
import utilityRoutes from "./routes/utility-routes.js"
import profileRoutes from "./routes/profile-routes.js" // add
import statsRoutes from "./routes/stats-routes.js" // mount stats routes under /api
import recordsRoutes from "./routes/records-routes.js" // mount records routes

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(morgan("dev"))

app.get("/", (_req, res) => {
  res.json({ ok: true, name: "Expense Approval API" })
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/expenses", expenseRoutes)
app.use("/api/rules", ruleRoutes)
app.use("/api/utils", utilityRoutes)
app.use("/api/profile", profileRoutes) // add
app.use("/api", statsRoutes) // mount stats routes under /api
app.use("/api", recordsRoutes) // mount records routes

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`)
  })
})
