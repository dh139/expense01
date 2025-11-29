import Tesseract from "tesseract.js"

const AMOUNT_WITH_CURRENCY_REGEX = /(?:rs\.?|inr)\s*([\d]+(?:[.,]\d{2})?)/i
const AMOUNT_KEYWORDS_REGEX = /(?:total|amount|paid|grand\s*total)[^\d]*([\d.,]+)\b/i
const ANY_AMOUNT_REGEX = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+[.,]\d{2})/g
const DATE_REGEX = /(\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b|\b\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\b)/i

function normalizeNumber(str) {
  if (!str) return null
  const cleaned = str.replace(/[^\d.,]/g, "")
  // Prefer dot as decimal separator
  if (cleaned.indexOf(",") > -1 && cleaned.indexOf(".") === -1) {
    // Assume comma is decimal if only comma exists
    return Number.parseFloat(cleaned.replace(",", "."))
  }
  // Remove thousands commas
  return Number.parseFloat(cleaned.replace(/,/g, ""))
}

function parseDateToISO(textDate) {
  if (!textDate) return null
  // support dd/mm/yyyy or yyyy-mm-dd
  const d = textDate.replace(/-/g, "/").split("/")
  if (d.length !== 3) return null
  // detect year position
  if (d[0].length === 4) {
    // yyyy/mm/dd
    const [y, m, day] = d
    const dt = new Date(Number(y), Number(m) - 1, Number(day))
    return isNaN(dt.getTime()) ? null : dt.toISOString()
  } else {
    // dd/mm/yyyy
    const [day, m, y] = d
    const year = y.length === 2 ? `20${y}` : y
    const dt = new Date(Number(year), Number(m) - 1, Number(day))
    return isNaN(dt.getTime()) ? null : dt.toISOString()
  }
}

function guessMerchant(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  // skip typical headers
  const blacklist = [/gst/i, /bill/i, /waiter/i, /table/i, /date/i, /time/i]
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i]
    if (blacklist.some((rx) => rx.test(line))) continue
    // Prefer lines with uppercase words and letters
    if (/[A-Za-z]/.test(line)) return line.replace(/[^A-Za-z0-9 '&.-]/g, "").trim()
  }
  return null
}

export async function extractReceipt(buffer) {
  const { data } = await Tesseract.recognize(buffer, "eng", {
    tessedit_char_blacklist: "[]{}",
    preserve_interword_spaces: "1",
  })
  let text = data.text || ""

  // Common OCR cleanups
  text = text
    .replace(/\bRe\b/g, "Rs") // Re -> Rs
    .replace(/\bS\s*GST\b/gi, "SGST")
    .replace(/\bC\s*GST\b/gi, "CGST")
    .replace(/[O]/g, "0") // sometimes O->0 in numbers context (rough)

  // Amount extraction strategy
  let amount = null

  // 1) Rs/INR tagged amount
  const m1 = text.match(AMOUNT_WITH_CURRENCY_REGEX)
  if (m1) amount = normalizeNumber(m1[1])

  // 2) Keyword-based total
  if (amount == null) {
    const m2 = text.match(AMOUNT_KEYWORDS_REGEX)
    if (m2) amount = normalizeNumber(m2[1])
  }

  // 3) Fallback: find all decimal-like numbers and pick LAST or MAX near bottom
  if (amount == null) {
    const all = [...text.matchAll(ANY_AMOUNT_REGEX)].map((m) => normalizeNumber(m[1])).filter((n) => !isNaN(n))
    if (all.length) {
      // choose the max if plausible (totals usually largest)
      const max = Math.max(...all)
      amount = max
    }
  }

  // Date
  const dateMatch = text.match(DATE_REGEX)
  const dateISO = dateMatch ? parseDateToISO(dateMatch[1]) : null

  // Merchant fallback from top lines if keywords absent
  const merchantFallback = guessMerchant(text)

  return {
    rawText: text,
    amount: typeof amount === "number" && !isNaN(amount) ? amount : null,
    date: dateISO,
    description: merchantFallback ? `Receipt from ${merchantFallback}` : "",
  }
}
