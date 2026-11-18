export function formatBDT(amount) {
  if (amount == null) return '৳0'
  return `৳${Number(amount).toLocaleString('en-IN')}`
}

export function formatBDTCompact(amount) {
  if (amount == null) return '৳0'
  const num = Number(amount)
  if (num >= 10000000) return `৳${(num / 10000000).toFixed(1)}Cr`
  if (num >= 100000) return `৳${(num / 100000).toFixed(1)}L`
  if (num >= 1000) return `৳${(num / 1000).toFixed(1)}K`
  return `৳${num.toLocaleString('en-IN')}`
}

export function parseBDT(str) {
  if (!str) return 0
  return parseFloat(str.toString().replace(/[৳,]/g, '')) || 0
}