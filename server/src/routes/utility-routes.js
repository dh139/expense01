import express from "express"
import axios from "axios"
import { requireAuth } from "../middleware/auth.js"
import { getRates } from "../services/currency-service.js"

const router = express.Router()

// GET /api/utils/countries
router.get("/countries", requireAuth, async (_req, res) => {
  const { data } = await axios.get("https://restcountries.com/v3.1/all?fields=name,currencies")
  const countries = (data || [])
    .map((c) => ({
      name: c?.name?.common,
      currencies: Object.keys(c?.currencies || {}),
    }))
    .filter((c) => !!c.name && c.currencies.length > 0)
  res.json(countries)
})

// GET /api/utils/rates/:base
router.get("/rates/:base", requireAuth, async (req, res) => {
  try {
    const rates = await getRates(req.params.base.toUpperCase())
    res.json(rates)
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch rates" })
  }
})

export default router
