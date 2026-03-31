/**
 * Downloads toponyms of category "Poblaciones y Unidades poblacionales"
 * (CLASIFICACION_SECUNDARIA = '2.1') from the Cantabria Government ArcGIS service
 * and generates a CSV ready to review and import.
 *
 * Usage:
 *   node scripts/import-poblaciones.mjs
 *   node scripts/import-poblaciones.mjs --out poblaciones.csv
 */

import fs from 'fs'
import path from 'path'
import https from 'https'

const ARCGIS_URL = 'https://services-eu1.arcgis.com/nA3ZoO5T3PsqLUnE/arcgis/rest/services/Toponimia_de_Cantabria_Registro_Principal/FeatureServer/0/query'
// Exclude municipal districts (2.1.7, purely administrative)
// and urban barrios of Santander (2.1.8 + MUNICIPIO='075') — modern housing estates, not traditional toponyms
// Rural barrios (2.1.8) in other municipalities are valid toponyms and are included
const WHERE = "CLASIFICACION_SECUNDARIA='2.1' AND CODIGO_NGBE <> '2.1.7' AND NOT (CODIGO_NGBE='2.1.8' AND MUNICIPIO='075')"
const PAGE_SIZE = 2000

const MUNICIPALITIES = {
  '001':'ALFOZ DE LLOREDO','002':'AMPUERO','003':'ANIEVAS','004':'ARENAS DE IGUÑA',
  '005':'ARGOÑOS','006':'ARNUERO','007':'ARREDONDO','008':'ASTILLERO (EL)',
  '009':'BÁRCENA DE CICERO','010':'BÁRCENA DE PIE DE CONCHA','011':'BAREYO',
  '012':'CABEZÓN DE LA SAL','013':'CABEZÓN DE LIÉBANA','014':'CABUÉRNIGA',
  '015':'CAMALEÑO','016':'CAMARGO','017':'CAMPOO DE YUSO','018':'CARTES',
  '019':'CASTAÑEDA','020':'CASTRO-URDIALES','021':'CIEZA','022':'CILLORIGO DE LIÉBANA',
  '023':'COLINDRES','024':'COMILLAS','025':'CORRALES DE BUELNA (LOS)',
  '026':'CORVERA DE TORANZO','027':'CAMPOO DE ENMEDIO','028':'ENTRAMBASAGUAS',
  '029':'ESCALANTE','030':'GURIEZO','031':'HAZAS DE CESTO',
  '032':'HERMANDAD DE CAMPOO DE SUSO','033':'HERRERÍAS','034':'LAMASÓN',
  '035':'LAREDO','036':'LIENDO','037':'LIÉRGANES','038':'LIMPIAS','039':'LUENA',
  '040':'MARINA DE CUDEYO','041':'MAZCUERRAS','042':'MEDIO CUDEYO','043':'MERUELO',
  '044':'MIENGO','045':'MIERA','046':'MOLLEDO','047':'NOJA','048':'PENAGOS',
  '049':'PEÑARRUBIA','050':'PESAGUERO','051':'PESQUERA','052':'PIÉLAGOS',
  '053':'POLACIONES','054':'POLANCO','055':'POTES','056':'PUENTE VIESGO',
  '057':'RAMALES DE LA VICTORIA','058':'RASINES','059':'REINOSA','060':'REOCÍN',
  '061':'RIBAMONTÁN AL MAR','062':'RIBAMONTÁN AL MONTE','063':'RIONANSA',
  '064':'RIOTUERTO','065':'ROZAS DE VALDEARROYO (LAS)','066':'RUENTE','067':'RUESGA',
  '068':'RUILOBA','069':'SAN FELICES DE BUELNA','070':'SAN MIGUEL DE AGUAYO',
  '071':'SAN PEDRO DEL ROMERAL','072':'SAN ROQUE DE RIOMIERA','073':'SANTA CRUZ DE BEZANA',
  '074':'SANTA MARÍA DE CAYÓN','075':'SANTANDER','076':'SANTILLANA DEL MAR',
  '077':'SANTIURDE DE REINOSA','078':'SANTIURDE DE TORANZO','079':'SANTOÑA',
  '080':'SAN VICENTE DE LA BARQUERA','081':'SARO','082':'SELAYA','083':'SOBA',
  '084':'SOLÓRZANO','085':'SUANCES','086':'TOJOS (LOS)','087':'TORRELAVEGA',
  '088':'TRESVISO','089':'TUDANCA','090':'UDÍAS','091':'VALDÁLIGA','092':'VALDEOLEA',
  '093':'VALDEPRADO DEL RÍO','094':'VALDERREDIBLE','095':'VAL DE SAN VICENTE',
  '096':'VEGA DE LIÉBANA','097':'VEGA DE PAS','098':'VILLACARRIEDO',
  '099':'VILLAESCUSA','100':'VILLAFUFRE','101':'VALLE DE VILLAVERDE','102':'VOTO',
}

// --- ArcGIS helpers ---

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch(e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function fetchPage(offset) {
  const params = new URLSearchParams({
    f: 'json',
    where: WHERE,
    outFields: 'OBJECTID,IDENTIFICADOR_GEOGRAFICO,MUNICIPIO,TIPO,OBSERVACIONES_PUB',
    returnGeometry: 'true',
    outSR: '4326',
    resultOffset: offset,
    resultRecordCount: PAGE_SIZE,
    orderByFields: 'IDENTIFICADOR_GEOGRAFICO ASC',
  })
  return fetchJson(`${ARCGIS_URL}?${params}`)
}

// --- PARES helpers ---

const PARES_HOST = 'pares.cultura.gob.es'
const PARES_BASE = `https://${PARES_HOST}`

// PARES requires a fresh session per search — sessions cannot be reused
function getFreshSession() {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: PARES_HOST,
      path: '/catastro/servlets/ServletController?ini=0&accion=0&mapas=0&tipo=0',
      rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }, res => {
      const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') ?? ''
      res.resume()
      res.on('end', () => resolve(cookie))
    }).on('error', reject)
  })
}

function postPares(cookie, body) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams(body).toString()
    const req = https.request({
      hostname: PARES_HOST,
      path: '/catastro/servlets/ServletController',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0',
        'Referer': `${PARES_BASE}/catastro/servlets/ServletController?ini=0&accion=0&mapas=0&tipo=0`,
      },
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function searchPares(name, provact = '0') {
  const cookie = await getFreshSession()
  const html = await postPares(cookie, {
    mapas: '0', accion: '1', volver: '0',
    txtBusqueda: name, tipo: '0', tipolocal: '-1', provact,
    Buscar: 'Buscar',
  })
  return [...new Set([...html.matchAll(/loc=(\d+)/g)].map(m => m[1]))]
}

// Returns a direct PARES URL (loc-based) if the name resolves unambiguously,
// or a search URL otherwise.
async function resolveParesUrl(name) {
  try {
    let locs = await searchPares(name, '0')
    if (locs.length === 1) {
      return `${PARES_BASE}/catastro/servlets/ServletController?accion=4&opcionV=3&orden=0&loc=${locs[0]}&pageNum=1`
    }
    if (locs.length > 1) {
      locs = await searchPares(name, '39') // filter by Cantabria
      if (locs.length === 1) {
        return `${PARES_BASE}/catastro/servlets/ServletController?accion=4&opcionV=3&orden=0&loc=${locs[0]}&pageNum=1`
      }
    }
  } catch (e) {
    process.stderr.write(`\nError resolving "${name}": ${e.message}\n`)
  }
  // Fallback: search URL filtered to Cantabria
  const q = encodeURIComponent(name)
  return `${PARES_BASE}/catastro/servlets/ServletController?mapas=0&accion=1&volver=0&txtBusqueda=${q}&tipo=0&tipolocal=-1&provact=39&Buscar=Buscar`
}

// --- Cache ---

const CACHE_FILE = path.resolve(process.cwd(), 'scripts/pares-cache.json')

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) } catch { return {} }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8')
}

// --- CSV ---

function csvEscape(val) {
  if (val == null) return ''
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}

const TIPO_LABEL = { '0': 'NGCE', '1': 'NGBE', '2': 'Autonómico' }
const ENSENADA_RE = /ensenada/i

// --- Main ---

async function main() {
  const outArg = process.argv.indexOf('--out')
  const outFile = outArg !== -1 ? process.argv[outArg + 1] : 'poblaciones.csv'

  console.log('Fetching toponyms (CLASIFICACION_SECUNDARIA = 2.1)...')
  const features = []
  let offset = 0
  while (true) {
    console.log(`  offset=${offset}...`)
    const data = await fetchPage(offset)
    if (!data.features?.length) break
    features.push(...data.features)
    console.log(`  → ${features.length} records`)
    if (!data.exceededTransferLimit) break
    offset += PAGE_SIZE
  }
  console.log(`\nTotal: ${features.length} toponyms`)

  // Resolve PARES URLs for Ensenada toponyms
  const ensenadaFeatures = features.filter(f => ENSENADA_RE.test(f.attributes.OBSERVACIONES_PUB ?? ''))
  const uniqueNames = [...new Set(ensenadaFeatures.map(f => f.attributes.IDENTIFICADOR_GEOGRAFICO))]

  const cache = loadCache()
  const pending = uniqueNames.filter(n => !(n in cache))
  console.log(`\nResolving ${uniqueNames.length} Ensenada toponyms in PARES...`)
  console.log(`  Cached: ${uniqueNames.length - pending.length}, pending: ${pending.length}`)

  let done = 0
  for (const name of pending) {
    cache[name] = await resolveParesUrl(name)
    saveCache(cache)
    process.stdout.write(`\r  ${++done}/${pending.length} — ${name}                    `)
  }
  if (pending.length) console.log('\n')

  // Build CSV
  const rows = features.map(f => {
    const a = f.attributes
    const municipality = MUNICIPALITIES[a.MUNICIPIO] ?? a.MUNICIPIO ?? ''
    const isEnsenada = ENSENADA_RE.test(a.OBSERVACIONES_PUB ?? '')
    const q = encodeURIComponent(a.IDENTIFICADOR_GEOGRAFICO)
    const searchUrl = `${PARES_BASE}/catastro/servlets/ServletController?mapas=0&accion=1&volver=0&txtBusqueda=${q}&tipo=0&tipolocal=-1&provact=39&Buscar=Buscar`
    const source = isEnsenada ? (cache[a.IDENTIFICADOR_GEOGRAFICO] ?? searchUrl) : ''
    const date = isEnsenada ? '1749-1753' : ''
    return [
      csvEscape(a.IDENTIFICADOR_GEOGRAFICO),
      csvEscape(f.geometry?.y?.toFixed(6) ?? ''),
      csvEscape(f.geometry?.x?.toFixed(6) ?? ''),
      csvEscape(municipality),
      csvEscape(TIPO_LABEL[a.TIPO] ?? a.TIPO ?? ''),
      csvEscape(source),
      csvEscape(date),
      csvEscape(a.OBJECTID),
    ]
  })

  const header = ['name', 'lat', 'lng', 'municipality', 'ngbe_type', 'source', 'date', 'arcgis_objectid']
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')

  const outPath = path.resolve(process.cwd(), outFile)
  fs.writeFileSync(outPath, csv, 'utf8')
  console.log(`\nSaved to: ${outPath}`)

  const withLoc = rows.filter(r => r[5]?.includes('loc=')).length
  const withSearch = rows.filter(r => r[5]?.includes('txtBusqueda')).length
  console.log(`PARES: ${withLoc} direct loc links, ${withSearch} search links`)
}

main().catch(e => { console.error(e); process.exit(1) })
