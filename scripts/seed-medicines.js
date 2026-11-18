#!/usr/bin/env node
/**
 * Seed Medicines Processor
 * Reads medicines-raw.json, deduplicates, formats for autocomplete
 * Output: src/data/medicines.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const RAW_PATH = resolve('src/data/medicines-raw.json')
const OUT_PATH = resolve('src/data/medicines.json')

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function main() {
  console.log('=== Seed Medicines ===')

  if (!existsSync(RAW_PATH)) {
    console.error('Raw data not found. Run "node scripts/scrape-medex.js" first.')
    process.exit(1)
  }

  const raw = JSON.parse(readFileSync(RAW_PATH, 'utf-8'))
  console.log(`Raw items: ${raw.length}`)

  const seen = new Set()
  const medicines = []

  for (const item of raw) {
    let searchName, displayName

    if (item.brand) {
      // Brand entry
      searchName = normalizeName(item.brand)
      displayName = `${item.brand} (${item.generic}) ${item.strength}`
    } else if (item.generic) {
      // Generic entry
      searchName = normalizeName(item.generic)
      displayName = `${item.generic} ${item.strength}`
    } else {
      continue
    }

    const key = searchName
    if (seen.has(key)) continue
    seen.add(key)

    medicines.push({
      name: searchName,
      display: displayName,
      generic: item.generic || '',
      strength: item.strength || '',
      source: 'medex'
    })
  }

  // Sort by name
  medicines.sort((a, b) => a.name.localeCompare(b.name))

  writeFileSync(OUT_PATH, JSON.stringify(medicines, null, 2))
  console.log(`Processed ${medicines.length} unique medicines → ${OUT_PATH}`)
}

main()