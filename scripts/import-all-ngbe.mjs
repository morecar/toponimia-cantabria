/**
 * Downloads all toponyms from the Cantabria Government ArcGIS service
 * across all useful CLASIFICACION_SECUNDARIA categories and outputs public/ngbe.json.
 *
 * Usage: node scripts/import-all-ngbe.mjs
 */

import fs from 'fs'
import https from 'https'
import path from 'path'

const BASE_URL = 'https://services-eu1.arcgis.com/nA3ZoO5T3PsqLUnE/arcgis/rest/services/Toponimia_de_Cantabria_Registro_Principal/FeatureServer/0/query'
const PAGE_SIZE = 2000
const OUT_FILE  = path.resolve(process.cwd(), 'public/ngbe.json')

// Categories to download (with human-readable labels)
// 4.2 (Tierras/Parajes) has ~25K entries — include since user wants everything
const CATEGORIES = [
  { cat: '2.1', label: 'Entidades de población',   where: "CLASIFICACION_SECUNDARIA='2.1' AND CODIGO_NGBE IN ('2.1.3','2.1.4','2.1.5','2.1.6','2.1.9')" },
  { cat: '2.2', label: 'Edificios y equipamientos', where: "CLASIFICACION_SECUNDARIA='2.2'" },
  { cat: '4.1', label: 'Orografía',                 where: "CLASIFICACION_SECUNDARIA='4.1'" },
  { cat: '4.2', label: 'Tierras y parajes',         where: "CLASIFICACION_SECUNDARIA='4.2'" },
  { cat: '4.3', label: 'Cotos',                     where: "CLASIFICACION_SECUNDARIA='4.3'" },
  { cat: '5.1', label: 'Ríos y arroyos',            where: "CLASIFICACION_SECUNDARIA='5.1'" },
  { cat: '5.2', label: 'Marismas y lagunas',        where: "CLASIFICACION_SECUNDARIA='5.2'" },
  { cat: '5.3', label: 'Canales',                   where: "CLASIFICACION_SECUNDARIA='5.3'" },
  { cat: '5.4', label: 'Embalses y azudes',         where: "CLASIFICACION_SECUNDARIA='5.4'" },
  { cat: '5.5', label: 'Fuentes y manantiales',     where: "CLASIFICACION_SECUNDARIA='5.5'" },
  { cat: '6.1', label: 'Estuarios y bahías',        where: "CLASIFICACION_SECUNDARIA='6.1'" },
  { cat: '6.2', label: 'Costas y playas',           where: "CLASIFICACION_SECUNDARIA='6.2'" },
  { cat: '6.3', label: 'Bajos y bajíos',            where: "CLASIFICACION_SECUNDARIA='6.3'" },
]

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch(e) { reject(new Error(e.message + '\n' + data.slice(0, 200))) }
      })
    }).on('error', reject)
  })
}

async function fetchCategory({ cat, label, where }) {
  const features = []
  let offset = 0
  process.stdout.write(`  ${cat} ${label}…`)
  while (true) {
    const params = new URLSearchParams({
      f: 'json',
      where,
      outFields: 'OBJECTID,IDENTIFICADOR_GEOGRAFICO,MUNICIPIO,CODIGO_NGBE',
      returnGeometry: 'true',
      outSR: '4326',
      resultOffset: offset,
      resultRecordCount: PAGE_SIZE,
      orderByFields: 'IDENTIFICADOR_GEOGRAFICO ASC',
    })
    const data = await fetchJson(`${BASE_URL}?${params}`)
    if (data.error) throw new Error(JSON.stringify(data.error))
    if (!data.features?.length) break
    features.push(...data.features)
    process.stdout.write(` ${features.length}`)
    if (!data.exceededTransferLimit) break
    offset += PAGE_SIZE
  }
  console.log()
  return features.map(f => ({
    name: f.attributes.IDENTIFICADOR_GEOGRAFICO,
    lat:  f.geometry?.y ? parseFloat(f.geometry.y.toFixed(6)) : null,
    lng:  f.geometry?.x ? parseFloat(f.geometry.x.toFixed(6)) : null,
    mun:  f.attributes.MUNICIPIO ?? '',
    code: f.attributes.CODIGO_NGBE ?? cat,
    cat,
    id:   f.attributes.OBJECTID,
  })).filter(e => e.lat && e.lng)
}

async function main() {
  console.log('Downloading NGBE toponyms from ArcGIS…\n')
  const allEntries = []

  for (const category of CATEGORIES) {
    const entries = await fetchCategory(category)
    allEntries.push(...entries)
  }

  console.log(`\nTotal: ${allEntries.length} features`)
  fs.writeFileSync(OUT_FILE, JSON.stringify(allEntries))
  console.log(`Saved to: ${OUT_FILE} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB)`)
}

main().catch(e => { console.error(e); process.exit(1) })
