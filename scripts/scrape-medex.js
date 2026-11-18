#!/usr/bin/env node
/**
 * MedEx Medicine Scraper
 * Fetches brand names, generic names, and strengths from medex.com.bd
 * Run: node scripts/scrape-medex.js
 * Output: src/data/medicines-raw.json (then run seed-medicines.js)
 */

import fetch from 'node-fetch'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const BASE_URL = 'https://medex.com.bd'
const BRANDS_URL = `${BASE_URL}/brands`
const GENERICS_URL = `${BASE_URL}/generics`

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function extractLinks(html, base) {
  const links = []
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const href = match[1].startsWith('http') ? match[1] : base + match[1]
    const text = match[2].trim()
    if (text && !text.includes('...') && text.length > 1) {
      links.push({ href, text })
    }
  }
  return links
}

function extractTableData(html) {
  const rows = []
  const tableRegex = /<table[^>]*class=["'][^"']*table[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi
  let tableMatch
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1]
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let rowMatch
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1]
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
      const cells = []
      let cellMatch
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        const text = cellMatch[1].replace(/<[^>]+>/g, '').trim()
        cells.push(text)
      }
      if (cells.length >= 2) rows.push(cells)
    }
  }
  return rows
}

async function scrapeBrands() {
  console.log('Fetching brands index...')
  const html = await fetchPage(BRANDS_URL)
  const links = extractLinks(html, BASE_URL)
  const brandLinks = links.filter(l => l.href.includes('/brands/') && !l.href.endsWith('/brands'))
  console.log(`Found ${brandLinks.length} brand pages`)

  const brands = []
  for (let i = 0; i < brandLinks.length; i++) {
    const { href, text } = brandLinks[i]
    try {
      const pageHtml = await fetchPage(href)
      const tables = extractTableData(pageHtml)
      for (const row of tables) {
        if (row.length >= 3) {
          const brand = row[0]
          const generic = row[1]
          const strength = row[2]
          if (brand && generic && strength) {
            brands.push({ brand, generic, strength, source: 'medex' })
          }
        }
      }
      if (i % 20 === 0) console.log(`  Processed ${i + 1}/${brandLinks.length} brands...`)
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      console.warn(`Failed ${href}:`, e.message)
    }
  }
  return brands
}

async function scrapeGenerics() {
  console.log('Fetching generics index...')
  const html = await fetchPage(GENERICS_URL)
  const links = extractLinks(html, BASE_URL)
  const genericLinks = links.filter(l => l.href.includes('/generics/') && !l.href.endsWith('/generics'))
  console.log(`Found ${genericLinks.length} generic pages`)

  const generics = []
  for (let i = 0; i < genericLinks.length; i++) {
    const { href, text } = genericLinks[i]
    try {
      const pageHtml = await fetchPage(href)
      const tables = extractTableData(pageHtml)
      for (const row of tables) {
        if (row.length >= 2) {
          const generic = row[0]
          const strength = row[1]
          if (generic && strength) {
            generics.push({ generic, strength, source: 'medex' })
          }
        }
      }
      if (i % 20 === 0) console.log(`  Processed ${i + 1}/${genericLinks.length} generics...`)
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      console.warn(`Failed ${href}:`, e.message)
    }
  }
  return generics
}

async function main() {
  console.log('=== MedEx Scraper Started ===')
  const [brands, generics] = await Promise.all([scrapeBrands(), scrapeGenerics()])

  const all = [...brands, ...generics]
  console.log(`Total items scraped: ${all.length}`)

  const outDir = resolve('src/data')
  mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, 'medicines-raw.json')
  writeFileSync(outPath, JSON.stringify(all, null, 2))
  console.log(`Written to ${outPath}`)
  console.log('Run "node scripts/seed-medicines.js" to generate medicines.json')
}

main().catch(e => {
  console.error('Scraper failed:', e)
  process.exit(1)
})