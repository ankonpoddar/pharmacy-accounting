const BD_TIMEZONE = 'Asia/Dhaka'

export function getTodayBD() {
  return new Date().toLocaleDateString('en-CA', { timeZone: BD_TIMEZONE })
}

export function getDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: BD_TIMEZONE })
}

export function formatDateBD(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('bn-BD', {
    timeZone: BD_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateEN(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    timeZone: BD_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateDisplay(dateStr, lang) {
  return lang === 'bn' ? formatDateBD(dateStr) : formatDateEN(dateStr)
}

export function isToday(dateStr) {
  return dateStr === getTodayBD()
}

export function startOfDay(dateStr) {
  return new Date(dateStr + 'T00:00:00').toISOString()
}

export function endOfDay(dateStr) {
  return new Date(dateStr + 'T23:59:59.999').toISOString()
}

export function sortByDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date)
}