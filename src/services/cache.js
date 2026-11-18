import medicinesData from '../data/medicines.json'

let medicinesCache = null
let customMedicinesCache = null

export async function loadMedicines() {
  if (medicinesCache) return medicinesCache

  // Start with seeded data
  medicinesCache = [...medicinesData]

  // Try to load custom medicines from localStorage (offline) or Firestore (online)
  try {
    const customLocal = localStorage.getItem('pharmacy_custom_medicines')
    if (customLocal) {
      const parsed = JSON.parse(customLocal)
      if (Array.isArray(parsed)) {
        medicinesCache.push(...parsed)
      }
    }
  } catch (e) {
    console.warn('Failed to load custom medicines from localStorage:', e)
  }

  // Sort by name
  medicinesCache.sort((a, b) => a.name.localeCompare(b.name))

  return medicinesCache
}

export async function searchMedicines(query, limit = 10) {
  if (!query || query.length < 2) return []
  const all = await loadMedicines()
  const q = query.toLowerCase().trim()
  return all
    .filter(m => m.name.includes(q) || (m.generic && m.generic.toLowerCase().includes(q)))
    .slice(0, limit)
}

export async function addCustomMedicine(medicine) {
  const custom = {
    name: medicine.name.toLowerCase().trim(),
    display: medicine.display,
    generic: medicine.generic || '',
    strength: medicine.strength || '',
    source: 'custom'
  }

  // Update localStorage cache
  try {
    const existing = JSON.parse(localStorage.getItem('pharmacy_custom_medicines') || '[]')
    if (!existing.find(m => m.name === custom.name)) {
      existing.push(custom)
      localStorage.setItem('pharmacy_custom_medicines', JSON.stringify(existing))
    }
  } catch (e) {
    console.warn('Failed to save custom medicine locally:', e)
  }

  // Update in-memory cache
  if (medicinesCache && !medicinesCache.find(m => m.name === custom.name)) {
    medicinesCache.push(custom)
    medicinesCache.sort((a, b) => a.name.localeCompare(b.name))
  }

  return custom
}

export function clearMedicinesCache() {
  medicinesCache = null
  customMedicinesCache = null
}