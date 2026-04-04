import { joinWaysOrdered, sanitizeLineCoords } from '../../utils/geoUtils'

export const OVERPASS_URL   = 'https://overpass-api.de/api/interpreter'
export const CANTABRIA_BBOX = '42.8,-4.9,43.8,-3.1'

// Which NGBE categories have real OSM geometry, and what type.
export const OSM_GEO = {
  '5.1': { wayTags: '["waterway"~"river|stream"]', relTags: '["type"="waterway"]', type: 'line' },
  '5.2': { wayTags: '["natural"~"water|wetland"]',                                  type: 'poly' },
  '5.3': { wayTags: '["waterway"~"canal|drain"]',  relTags: '["type"="waterway"]', type: 'line' },
  '5.4': { wayTags: '["water"="reservoir"]',                                        type: 'poly' },
  '5.5': { wayTags: '["amenity"="fountain"]',                                       type: 'point' },
  '6.1': { wayTags: '["natural"~"bay|estuary"]',                                    type: 'poly' },
  '6.2': { wayTags: '["natural"="beach"]',                                          type: 'poly' },
}

// Serialises Overpass POST requests to avoid rate-limiting (250 ms gap).
let _overpassChain = Promise.resolve()
export function overpassPost(query) {
  const req = _overpassChain
    .then(() => new Promise(res => setTimeout(res, 250)))
    .then(() => fetch(OVERPASS_URL, { method: 'POST', body: new URLSearchParams({ data: query }) }))
    .then(r => r.text())
  _overpassChain = req.catch(() => {})
  return req
}

function decimateCoords(coords, max = 400) {
  if (coords.length <= max) return coords
  const step = Math.ceil(coords.length / max)
  return coords.filter((_, i) => i % step === 0 || i === coords.length - 1)
}

const OSM_GEOM_TTL      = 30 * 24 * 60 * 60 * 1000
const OSM_GEOM_CACHE_KEY = (cat, name) => `osm_geom_v5:${cat}:${name}`

export function geomCacheGet(name, cat) {
  try {
    const raw = localStorage.getItem(OSM_GEOM_CACHE_KEY(cat, name))
    if (!raw) return undefined
    const { ts, geom } = JSON.parse(raw)
    if (Date.now() - ts < OSM_GEOM_TTL) {
      if (geom?.type === 'line' && geom.coordinates) {
        return { ...geom, coordinates: sanitizeLineCoords(geom.coordinates) }
      }
      return geom
    }
    localStorage.removeItem(OSM_GEOM_CACHE_KEY(cat, name))
  } catch {}
  return undefined
}

export function geomCacheSet(name, cat, geom) {
  try {
    localStorage.setItem(OSM_GEOM_CACHE_KEY(cat, name), JSON.stringify({ ts: Date.now(), geom }))
  } catch {}
}

export async function fetchOsmGeometry(name, cat) {
  const geo = OSM_GEO[cat]
  if (!geo || geo.type === 'point') return null

  const cached = geomCacheGet(name, cat)
  if (cached !== undefined) return cached

  const safeName = name.replace(/"/g, '\\"')
  const patterns = [`^${safeName}$`]
  const stripped = safeName.replace(/^(Río|Rio|Arroyo|Regato|Canal|Embalse de(l| la)?|Pantano de(l| la)?|Playa de(l| la)?|Ensenada de(l| la)?|Bahía|Bahia)\s+/i, '')
  if (stripped !== safeName) {
    patterns.push(`^${stripped}$`)
    if (stripped.length >= 4) patterns.push(stripped)
  }

  let gotValidJson = false
  const wayTags = geo.wayTags ?? geo.tags ?? ''
  const relTags = geo.relTags ?? wayTags

  for (const pattern of patterns) {
    const nameFilter = `["name"~"${pattern}",i]`
    const q = `[out:json][timeout:25];(way${wayTags}${nameFilter}(${CANTABRIA_BBOX});relation${relTags}${nameFilter}(${CANTABRIA_BBOX}););out geom;`
    console.log('[OSM] pattern:', JSON.stringify(pattern), '—', name, cat)
    try {
      const text = await overpassPost(q)
      if (!text.trimStart().startsWith('{')) {
        console.warn('[OSM] XML error for pattern:', pattern, '|', text.slice(0, 200))
        continue
      }
      const data = JSON.parse(text)
      gotValidJson = true
      console.log('[OSM] JSON ok, elements:', data.elements?.length, 'for pattern:', pattern)
      if (!data.elements?.length) continue

      const relation = data.elements.find(el => el.type === 'relation')
      if (relation?.members) {
        const ways = relation.members
          .filter(m => m.type === 'way' && m.geometry?.length)
          .map(m => m.geometry.map(pt => [pt.lat, pt.lon]))
        let coords = joinWaysOrdered(ways)
        if (geo.type === 'line') coords = sanitizeLineCoords(coords)
        if (coords.length >= 2) {
          const result = { type: geo.type, coordinates: decimateCoords(coords) }
          geomCacheSet(name, cat, result)
          return result
        }
      }

      const ways = data.elements
        .filter(el => el.type === 'way' && el.geometry?.length)
        .map(el => el.geometry.map(pt => [pt.lat, pt.lon]))
      let coords = joinWaysOrdered(ways)
      if (geo.type === 'line') coords = sanitizeLineCoords(coords)
      if (coords.length >= 2) {
        const result = { type: geo.type, coordinates: decimateCoords(coords) }
        geomCacheSet(name, cat, result)
        return result
      }
    } catch (e) {
      console.warn('[OSM] fetch/parse error:', e)
    }
  }

  if (gotValidJson) geomCacheSet(name, cat, null)
  return null
}
