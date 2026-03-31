/**
 * Merges ArcGIS toponyms from poblaciones.csv into public/toponyms.json,
 * skipping entries already present by name.
 *
 * Usage:
 *   node scripts/merge-arcgis.mjs
 *   node scripts/merge-arcgis.mjs --dry-run    (preview only, no file write)
 *   node scripts/merge-arcgis.mjs --clean       (remove existing arc* entries first)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const TOPONYMS_FILE = path.join(ROOT, 'public/toponyms.json')
const CSV_FILE = path.join(ROOT, 'poblaciones.csv')

const dryRun = process.argv.includes('--dry-run')
const clean = process.argv.includes('--clean')

// --- Load existing data ---
const existing = JSON.parse(fs.readFileSync(TOPONYMS_FILE, 'utf8'))

if (clean) {
  const before = Object.keys(existing.data).length
  const cleaned = {}
  let idx = 0
  for (const v of Object.values(existing.data)) {
    if (!v.hash.startsWith('arc')) cleaned[idx++] = v
  }
  existing.data = cleaned
  console.log(`--clean: removed ${before - idx} arc* entries (${idx} remaining)`)
}

const entries = Object.values(existing.data)
const existingNames = new Set(entries.map(e => e.name))
console.log(`Existing toponyms: ${entries.length}`)

// --- Parse CSV ---
const csv = fs.readFileSync(CSV_FILE, 'utf8')
const lines = csv.split('\n')
const header = lines[0].split(',')
const col = name => header.indexOf(name)

function parseRow(line) {
  // Handle quoted fields
  const fields = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { fields.push(current); current = '' }
    else { current += ch }
  }
  fields.push(current)
  return fields
}

const rows = lines.slice(1).filter(Boolean).map(parseRow)
console.log(`CSV rows: ${rows.length}`)

// Haversine distance in km between two [lat,lng] pairs
function distanceKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const MATCH_DISTANCE_KM = 2  // consolidate if same name and within 2 km

// Build spatial index for existing entries that have coordinates
const existingCoords = new Map()  // name -> [lat, lng]
for (const e of entries) {
  if (e.coordinates) {
    const [lat, lng] = e.coordinates.split(',').map(Number)
    existingCoords.set(e.name, [lat, lng])
  }
}

// --- Build new entries ---
const newEntries = []
const skipped = []
const consolidated = []

for (const row of rows) {
  const name = row[col('name')]
  if (!name) continue

  const lat = parseFloat(row[col('lat')])
  const lng = parseFloat(row[col('lng')])
  if (isNaN(lat) || isNaN(lng)) continue

  // Consolidate if same name and within MATCH_DISTANCE_KM
  if (existingCoords.has(name)) {
    const dist = distanceKm([lat, lng], existingCoords.get(name))
    if (dist <= MATCH_DISTANCE_KM) {
      consolidated.push(`${name} (${dist.toFixed(1)} km)`)
      continue
    }
  }

  if (existingNames.has(name)) { skipped.push(name); continue }

  const municipality = row[col('municipality')]
  const ngbeCode = row[col('ngbe_code')] || ''
  const objectId = row[col('arcgis_objectid')]

  const tagParts = ['meta_category:settlement']
  if (municipality) tagParts.push(`municipality:${municipality.toLowerCase().replace(/\s+/g, '_')}`)
  if (ngbeCode) tagParts.push(`arcgis:${ngbeCode.replace(/\./g, '_')}`)

  newEntries.push({
    hash: `arc${objectId}`,
    name,
    type: 'point',
    coordinates: `${lat},${lng}`,
    tags: tagParts.join(','),
    attestations: [],
    etymology_ids: '',
  })
}

console.log(`Consolidated (same name, within ${MATCH_DISTANCE_KM} km): ${consolidated.length}`)
if (consolidated.length) console.log(' ', consolidated.join(', '))
console.log(`Skipped (same name, far away): ${skipped.length}`)
console.log(`New entries to add: ${newEntries.length}`)

if (dryRun) {
  console.log('\n--dry-run: no file written')
  console.log('Sample new entries:', JSON.stringify(newEntries.slice(0, 3), null, 2))
  process.exit(0)
}

// --- Merge into existing data ---
const startIndex = Object.keys(existing.data).length
newEntries.forEach((entry, i) => {
  existing.data[startIndex + i] = entry
})

fs.writeFileSync(TOPONYMS_FILE, JSON.stringify(existing, null, 2), 'utf8')
console.log(`\nWrote ${Object.keys(existing.data).length} total entries to ${TOPONYMS_FILE}`)
