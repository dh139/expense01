import axios from "axios"

const cache = new Map()
// key: base, value: { rates, expiresAt }

export async function getRates(base) {
  const key = base.toUpperCase()
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) return cached.rates

  const url = `https://api.exchangerate-api.com/v4/latest/${key}`
  const { data } = await axios.get(url)
  const rates = data.rates || {}
  cache.set(key, { rates, expiresAt: now + 1000 * 60 * 60 }) // 1h
  return rates
}

export async function convertAmount(amount, from, to) {
  const rates = await getRates(from)
  const rate = rates[to.toUpperCase()]
  if (!rate) throw new Error(`No rate from ${from} to ${to}`)
  return amount * rate
}
