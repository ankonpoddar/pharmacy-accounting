/**
 * Smart Quick Entry Parser
 * Parses natural text like:
 *   "napa 10 pc 12 taka"
 *   "seclo 20 140"
 *   "napa 10 12"
 *   "napa 10pc 12"
 *   "napa 10 12tk"
 * Returns: { medicine, quantity, unit, pricePerUnit, totalAmount } or null
 */

const UNIT_ALIASES = {
  pc: ['pc', 'pcs', 'piece', 'pieces', 'tab', 'tabs', 'tablet', 'tablets', 'cap', 'caps', 'capsule', 'capsules'],
  box: ['box', 'boxes', 'pkt', 'packet', 'pack', 'packs'],
  strip: ['strip', 'strips'],
  bottle: ['bottle', 'bottles', 'btl'],
  ml: ['ml'],
  mg: ['mg'],
  gm: ['gm', 'g', 'gram', 'grams']
}

const CURRENCY_ALIASES = ['taka', 'tk', '৳', 'bdT', 'BDT', 'rs', 'rupee', 'rupees']

function normalizeUnit(unit) {
  if (!unit) return 'pc'
  const lower = unit.toLowerCase().trim()
  for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
    if (aliases.includes(lower)) return canonical
  }
  return 'pc'
}

function parseQuantity(text) {
  // Match patterns like: "10", "10pc", "10 pc", "10pcs", "10 pcs"
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/)
  if (match) {
    return {
      qty: parseFloat(match[1]),
      unit: normalizeUnit(match[2] || 'pc')
    }
  }
  return null
}

function parseAmount(text) {
  // Match patterns like: "12", "12tk", "12 taka", "12৳"
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z৳]*)$/)
  if (match) {
    return parseFloat(match[1])
  }
  return null
}

export function parseQuickEntry(text) {
  if (!text || typeof text !== 'string') return null

  const tokens = text.trim().toLowerCase().split(/\s+/)
  if (tokens.length < 2) return null

  // First token is medicine name (could be multiple words)
  // We'll try to find the split point by looking for quantity/price patterns

  // Try: medicine + qty + price
  // Example: ["napa", "10", "12"] or ["napa", "10pc", "12tk"]

  // Find last two tokens that look like qty and price
  for (let i = tokens.length - 2; i >= 1; i--) {
    const maybeQty = parseQuantity(tokens[i])
    const maybePrice = parseAmount(tokens[i + 1])

    if (maybeQty && maybePrice !== null) {
      const medicine = tokens.slice(0, i).join(' ')
      return {
        medicine: medicine.trim(),
        quantity: maybeQty.qty,
        unit: maybeQty.unit,
        pricePerUnit: maybePrice,
        totalAmount: maybeQty.qty * maybePrice,
        raw: text
      }
    }
  }

  // Try: medicine + qty only (price = 0, user will enter)
  for (let i = tokens.length - 1; i >= 1; i--) {
    const maybeQty = parseQuantity(tokens[i])
    if (maybeQty) {
      const medicine = tokens.slice(0, i).join(' ')
      return {
        medicine: medicine.trim(),
        quantity: maybeQty.qty,
        unit: maybeQty.unit,
        pricePerUnit: 0,
        totalAmount: 0,
        raw: text
      }
    }
  }

  return null
}

export function formatQuickEntryPreview(parsed) {
  if (!parsed) return null
  const parts = [`${parsed.medicine}`]
  if (parsed.quantity) parts.push(`${parsed.quantity} ${parsed.unit}`)
  if (parsed.pricePerUnit) parts.push(`${parsed.pricePerUnit} ৳/unit`)
  if (parsed.totalAmount) parts.push(`= ${parsed.totalAmount} ৳`)
  return parts.join(' · ')
}