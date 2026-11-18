/**
 * Backup Service - Frontend interface for manual backup
 */

const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_URL || ''

export async function triggerManualBackup(date = null) {
  const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
  const url = `${FUNCTIONS_BASE}/manualBackup?date=${targetDate}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    return await response.json()
  } catch (error) {
    console.error('Manual backup failed:', error)
    return { success: false, error: error.message }
  }
}

export function formatBackupSummary(summary) {
  return {
    totalSales: `৳${summary.totalSales?.toLocaleString() || '0'}`,
    totalDueGiven: `৳${summary.totalDueGiven?.toLocaleString() || '0'}`,
    totalDueCollected: `৳${summary.totalDueCollected?.toLocaleString() || '0'}`,
    totalExpenses: `৳${summary.totalExpenses?.toLocaleString() || '0'}`,
    netCash: `৳${summary.netCash?.toLocaleString() || '0'}`
  }
}