import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import BackofficeMap from './BackofficeMap'
import {
  getDrafts, saveDraft, deleteDraft, newDraftId, exportDrafts,
  getDraftEtymologies, saveDraftEtymology, deleteDraftEtymology, newDraftEtymId,
} from '../model/draftStore'
import { ROUTE_BACKOFFICE } from '../resources/routes'

const EMPTY_FORM = () => ({
  draftId: null,
  hash: null,        // null = nuevo topónimo; set = editando uno existente
  name: '',
  vernacular: '',
  type: 'point',
  coordinates: [],
  tags: [],
  attestations: [],
  etymology_ids: [],
  notes: '',
})

const EMPTY_ATTESTATION = () => ({ year: '', highlight: '', source: '', quote: '', url: '' })
const EMPTY_NEW_ETYM = () => ({ origin: '', meaning: '', notes: '' })
const EMPTY_ETYM_FORM = () => ({ id: null, origin: '', meaning: '', notes: '', tags: '' })

// ── Source templates ──────────────────────────────────────────────────────────
const SOURCE_TEMPLATES = [
  { label: 'Catastro Ensenada',    year: '1749', source: 'Catastro de Ensenada',                   url: 'https://pares.cultura.gob.es/catastro/servlets/ServletController' },
  { label: 'Becerro Behetrías',    year: '1352', source: 'Becerro de las Behetrías de Castilla',   url: '' },
  { label: 'Libro de la Montería', year: '1348', source: 'Libro de la Montería, Alfonso XI',       url: '' },
]

import { joinWaysOrdered, sanitizeLineCoords } from '../utils/geoUtils'

// ── OSM / Overpass geometry enrichment ────────────────────────────────────────
const OVERPASS_URL  = 'https://overpass-api.de/api/interpreter'
const CANTABRIA_BBOX = '42.8,-4.9,43.8,-3.1'

// Which NGBE categories have real OSM geometry, and what type
const OSM_GEO = {
  '5.1': { tags: '["waterway"]',             type: 'line' },
  '5.2': { tags: '["natural"~"water|wetland"]', type: 'poly' },
  '5.3': { tags: '["waterway"="canal"]',     type: 'line' },
  '5.4': { tags: '["water"="reservoir"]',    type: 'poly' },
  '5.5': { tags: '["amenity"="fountain"]',   type: 'point' },
  '6.1': { tags: '["natural"~"bay|estuary"]', type: 'poly' },
  '6.2': { tags: '["natural"="beach"]',       type: 'poly' },
}

function decimateCoords(coords, max = 400) {
  if (coords.length <= max) return coords
  const step = Math.ceil(coords.length / max)
  return coords.filter((_, i) => i % step === 0 || i === coords.length - 1)
}


const OSM_GEOM_TTL = 30 * 24 * 60 * 60 * 1000  // 30 días

const OSM_GEOM_CACHE_KEY = (cat, name) => `osm_geom_v3:${cat}:${name}`

function geomCacheGet(name, cat) {
  try {
    const raw = localStorage.getItem(OSM_GEOM_CACHE_KEY(cat, name))
    if (!raw) return undefined
    const { ts, geom } = JSON.parse(raw)
    if (Date.now() - ts < OSM_GEOM_TTL) return geom  // null = "comprobado, no encontrado"
    localStorage.removeItem(OSM_GEOM_CACHE_KEY(cat, name))
  } catch {}
  return undefined
}

function geomCacheSet(name, cat, geom) {
  try {
    localStorage.setItem(OSM_GEOM_CACHE_KEY(cat, name), JSON.stringify({ ts: Date.now(), geom }))
  } catch {}
}

async function fetchOsmGeometry(name, cat) {
  const geo = OSM_GEO[cat]
  if (!geo || geo.type === 'point') return null

  // Check localStorage cache first (30-day TTL)
  const cached = geomCacheGet(name, cat)
  if (cached !== undefined) return cached  // null means "checked, not found"

  // Use the original name (with accents) — encodeURIComponent handles encoding in the POST body.
  const safeName = name.replace(/"/g, '\\"')

  // Overpass uses POSIX ERE — \b word boundaries are NOT supported (cause XML error).
  // Build patterns: exact full name, exact stripped core, then unanchored stripped as last resort.
  const patterns = [`^${safeName}$`]
  const stripped = safeName.replace(/^(Río|Rio|Arroyo|Regato|Canal|Embalse de(l| la)?|Pantano de(l| la)?|Playa de(l| la)?|Ensenada de(l| la)?|Bahía|Bahia)\s+/i, '')
  if (stripped !== safeName) {
    patterns.push(`^${stripped}$`)              // catches OSM naming without article ("Pas")
    if (stripped.length >= 4) patterns.push(stripped)  // unanchored fallback ("Río Pas (tramo…)")
  }

  let gotValidJson = false

  for (const pattern of patterns) {
    const nameFilter = `["name"~"${pattern}",i]`
    const q = `[out:json][timeout:25];(way${geo.tags}${nameFilter}(${CANTABRIA_BBOX});relation${geo.tags}${nameFilter}(${CANTABRIA_BBOX}););out geom;`
    console.log('[OSM] pattern:', JSON.stringify(pattern), '—', name, cat)
    try {
      // URLSearchParams handles encoding correctly and sets Content-Type automatically
      const res = await fetch(OVERPASS_URL, { method: 'POST', body: new URLSearchParams({ data: q }) })
      const text = await res.text()

      if (!text.trimStart().startsWith('{')) {
        // Overpass returned XML (query error) — don't treat as "not found", don't cache
        console.warn('[OSM] XML error for pattern:', pattern, '|', text.slice(0, 200))
        continue
      }

      const data = JSON.parse(text)
      gotValidJson = true
      console.log('[OSM] JSON ok, elements:', data.elements?.length, 'for pattern:', pattern)
      if (!data.elements?.length) continue

      // Prefer relation — members can be in any order/direction, so join properly
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

      // Fall back: join all matching ways in order
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

  // Only cache null when we got valid JSON (feature genuinely absent from OSM).
  // If all requests errored, don't cache — let it retry next time.
  if (gotValidJson) geomCacheSet(name, cat, null)
  return null
}

// ── NGBE ArcGIS service ────────────────────────────────────────────────────────
const NGBE_URL = 'https://services-eu1.arcgis.com/nA3ZoO5T3PsqLUnE/arcgis/rest/services/Toponimia_de_Cantabria_Registro_Principal/FeatureServer/0/query'
const NGBE_GROUP_LABELS = {
  '1': 'División administrativa',
  '2': 'Población y edificios',
  '3': 'Transporte',
  '4': 'Orografía y relieve',
  '5': 'Hidrografía continental',
  '6': 'Costa y mar',
}

const NGBE_CAT_LABELS = {
  '1.1': 'Comunidad autónoma',
  '1.2': 'Región',
  '1.3': 'Municipios',
  '1.4': 'Entidades de población',
  '1.5': 'Entidades singulares',
  '1.6': 'Núcleos',
  '1.7': 'Mancomunidades',
  '1.8': 'Entidades menores',
  '1.9': 'Zonas administrativas',
  '2.1': 'Núcleos de población',
  '2.2': 'Edificios y equipamientos',
  '2.3': 'Hitos y mojones',
  '3.1': 'Aeropuertos y aeródromos',
  '3.2': 'Puertos y dársenas',
  '3.3': 'Estaciones ferroviarias',
  '4.1': 'Orografía',
  '4.2': 'Tierras y parajes',
  '4.3': 'Cotos',
  '5.1': 'Ríos y arroyos',
  '5.2': 'Marismas y lagunas',
  '5.3': 'Canales y acequias',
  '5.4': 'Embalses y azudes',
  '5.5': 'Fuentes y manantiales',
  '6.1': 'Estuarios y bahías',
  '6.2': 'Costas y playas',
  '6.3': 'Bajos y bajíos',
}

// ── Scanner helpers ───────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Build a regex pattern that matches accent variants and treats b=v (case-insensitive flag handles case)
function toFlexiblePattern(str) {
  const base = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents from pattern
  const vowelGroups = { a: 'aáàäâãå', e: 'eéèëê', i: 'iíìïî', o: 'oóòöôõ', u: 'uúùüû' }
  return base.split('').map(ch => {
    const l = ch.toLowerCase()
    if (vowelGroups[l]) return `[${vowelGroups[l]}]`
    if (l === 'n')           return '[nñ]'
    if (l === 'b' || l === 'v') return '[bv]'
    return escapeRegex(ch)
  }).join('')
}

// Words too short or too generic to search alone
const MIN_TOKEN = 4
const SKIP_TOKENS = new Set(['este', 'esta', 'ello', 'para', 'entre', 'sobre', 'bajo', 'hasta', 'desde', 'junto', 'dicho'])

function getTokens(name) {
  return name
    .split(/[\s\-\/,.()+]+/)
    .filter(t => t.length >= MIN_TOKEN && !SKIP_TOKENS.has(t.toLowerCase()))
}

function scanTextForToponyms(text, entries) {
  if (!entries?.length || !text.trim()) return []
  const results = []
  const seen = new Set() // "hash:index" to deduplicate

  const tryMatch = (entry, pattern, matchedToken) => {
    try {
      const re = new RegExp(`(?<![\\wÀ-ÿ])${pattern}(?![\\wÀ-ÿ])`, 'gi')
      let match
      while ((match = re.exec(text)) !== null) {
        const key = `${entry.hash}:${match.index}`
        if (seen.has(key)) continue
        seen.add(key)
        const ctxStart = Math.max(0, match.index - 120)
        const ctxEnd   = Math.min(text.length, match.index + match[0].length + 120)
        results.push({
          entry,
          matchedForm:  text.slice(match.index, match.index + match[0].length),
          matchedToken,              // null = full name; string = which token matched
          index:        match.index,
          quote:        text.slice(ctxStart, ctxEnd).trim(),
        })
      }
    } catch {}
  }

  for (const entry of entries) {
    const name = entry.title
    if (!name || name.length < 3) continue

    // 1. Full name match
    tryMatch(entry, toFlexiblePattern(name), null)

    // 2. Individual token matches (only for multi-word toponyms)
    const tokens = getTokens(name)
    if (tokens.length > 1) {
      for (const token of tokens) {
        tryMatch(entry, toFlexiblePattern(token), token)
      }
    }
  }

  return results.sort((a, b) => a.index - b.index)
}

// ── Tag color by category ─────────────────────────────────────────────────────
function tagColor(tag) {
  if (tag.startsWith('etymology:')) return '#2563eb'
  if (tag.startsWith('feature:'))   return '#d97706'
  return '#6c757d'
}

// ── Tag autocomplete input ────────────────────────────────────────────────────
function TagInput({ tags, knownTags, loc, onChange }) {
  const [query, setQuery]               = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = knownTags.filter(
    t => !tags.includes(t) && t.toLowerCase().includes(query.toLowerCase())
  )
  const trimmed   = query.trim()
  const canCreate = trimmed && !knownTags.includes(trimmed) && !tags.includes(trimmed)

  const addTag = (tag) => {
    onChange([...tags, tag])
    setQuery('')
    setShowDropdown(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length > 0) addTag(filtered[0])
      else if (canCreate)       addTag(trimmed)
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  return (
    <div className="bo-tag-input-wrap" ref={wrapRef}>
      <div className="bo-tag-chips">
        {tags.map(tag => (
          <span key={tag} className="bo-tag-chip" style={{ background: tagColor(tag) }}>
            {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            <button className="bo-tag-chip-remove" onClick={() => onChange(tags.filter(t => t !== tag))}>×</button>
          </span>
        ))}
        <input
          className="bo-tag-search"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length ? '' : 'Buscar o crear etiqueta…'}
        />
      </div>
      {showDropdown && (filtered.length > 0 || canCreate) && (
        <div className="bo-dropdown">
          {filtered.map(tag => (
            <button key={tag} className="bo-dropdown-item" onClick={() => addTag(tag)}>
              <span className="bo-dropdown-dot" style={{ background: tagColor(tag) }} />
              {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
          {canCreate && (
            <button className="bo-dropdown-item bo-dropdown-create" onClick={() => addTag(trimmed)}>
              + Crear: <em>"{trimmed}"</em>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Etymology selector ────────────────────────────────────────────────────────
function EtymologySelector({ etymology_ids, etymologyStore, onChange }) {
  const [query, setQuery]               = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating]         = useState(false)
  const [newEtym, setNewEtym]           = useState(EMPTY_NEW_ETYM)
  const [draftEtyms, setDraftEtyms]     = useState(() => getDraftEtymologies())
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allEtymologies = [
    ...Array.from(etymologyStore?.byId?.values() || []),
    ...draftEtyms,
  ]

  const lq = query.toLowerCase()
  const filtered = query.length > 0
    ? allEtymologies.filter(e =>
        (e.origin  || '').toLowerCase().includes(lq) ||
        (e.meaning || '').toLowerCase().includes(lq) ||
        (e.notes   || '').toLowerCase().includes(lq)
      )
    : allEtymologies

  const selectedEtymologies = etymology_ids.map(id =>
    allEtymologies.find(e => e.id === id)
  ).filter(Boolean)

  const handleSelect = (etym) => {
    if (!etymology_ids.includes(etym.id)) onChange([...etymology_ids, etym.id])
    setQuery('')
    setShowDropdown(false)
  }

  const handleCreate = () => {
    if (!newEtym.origin.trim()) return
    const id   = newDraftEtymId()
    const etym = { ...newEtym, id }
    saveDraftEtymology(etym)
    setDraftEtyms(getDraftEtymologies())
    onChange([...etymology_ids, id])
    setCreating(false)
    setNewEtym(EMPTY_NEW_ETYM)
  }

  const newField = (key, value) => setNewEtym(e => ({ ...e, [key]: value }))

  return (
    <div className="bo-etym-wrap" ref={wrapRef}>
      {selectedEtymologies.map(e => (
        <div key={e.id} className="bo-etym-chip">
          <div className="bo-etym-chip-body">
            <strong>{e.origin}</strong>
            {e.meaning && <span> — {e.meaning}</span>}
          </div>
          <button className="bo-btn-icon" onClick={() => onChange(etymology_ids.filter(id => id !== e.id))}>×</button>
        </div>
      ))}

      {!creating && (
        <div className="bo-etym-search-row">
          <div className="bo-etym-search-wrap">
            <input
              className="bo-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar etimología existente…"
            />
            {showDropdown && (
              <div className="bo-dropdown">
                {filtered.length === 0 && (
                  <div className="bo-dropdown-empty">Sin resultados</div>
                )}
                {filtered.map(e => (
                  <button key={e.id} className="bo-dropdown-item" onClick={() => handleSelect(e)}>
                    <strong>{e.origin}</strong>
                    {e.meaning && <span className="bo-dropdown-sub"> — {e.meaning}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="bo-btn bo-btn-sm" onClick={() => { setShowDropdown(false); setCreating(true) }}>
            + Nueva
          </button>
        </div>
      )}

      {creating && (
        <div className="bo-etym-new-form">
          <input className="bo-input" placeholder="Origen *" value={newEtym.origin}
            onChange={e => newField('origin', e.target.value)} />
          <input className="bo-input" placeholder="Significado" value={newEtym.meaning}
            onChange={e => newField('meaning', e.target.value)} />
          <textarea className="bo-input bo-textarea" placeholder="Notas" rows={2}
            value={newEtym.notes} onChange={e => newField('notes', e.target.value)} />
          <div className="bo-etym-new-actions">
            <button className="bo-btn bo-btn-primary bo-btn-sm"
              onClick={handleCreate} disabled={!newEtym.origin.trim()}>
              Añadir
            </button>
            <button className="bo-btn bo-btn-sm" onClick={() => { setCreating(false); setNewEtym(EMPTY_NEW_ETYM) }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Attestation editor row ────────────────────────────────────────────────────
function AttestationRow({ att, onChange, onRemove }) {
  const field = (key, value) => onChange({ ...att, [key]: value })
  return (
    <div className="bo-attestation-row">
      <div className="bo-attestation-row-top">
        <input className="bo-input bo-input-sm" placeholder="Año" type="number"
          value={att.year} onChange={e => field('year', e.target.value)} />
        <input className="bo-input" placeholder="Forma atestiguada"
          value={att.highlight} onChange={e => field('highlight', e.target.value)} />
        <button className="bo-btn-icon" onClick={onRemove} title="Eliminar">×</button>
      </div>
      <input list="bo-source-list" className="bo-input" placeholder="Fuente"
        value={att.source} onChange={e => field('source', e.target.value)} />
      <textarea className="bo-input bo-textarea" placeholder="Cita"
        value={att.quote} onChange={e => field('quote', e.target.value)} rows={2} />
      <input className="bo-input" placeholder="URL"
        value={att.url} onChange={e => field('url', e.target.value)} />
    </div>
  )
}

// ── Draft list item ───────────────────────────────────────────────────────────
function DraftItem({ draft, onEdit, onDelete }) {
  const typeLabel = { point: 'Puntual', line: 'Lineal', poly: 'Zonal' }[draft.type] || draft.type
  return (
    <div className="bo-draft-item">
      <div className="bo-draft-item-info">
        <span className="bo-draft-name">{draft.name || <em>Sin nombre</em>}</span>
        <span className="bo-draft-meta">
          {draft.draftId} · {typeLabel}
          {draft.hash && <span className="bo-draft-edit-badge">edición</span>}
        </span>
      </div>
      <div className="bo-draft-item-actions">
        <button className="bo-btn bo-btn-sm" onClick={() => onEdit(draft)}>Editar</button>
        <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => onDelete(draft.draftId)}>✕</button>
      </div>
    </div>
  )
}

// ── Scanner result item ───────────────────────────────────────────────────────
function ScanResult({ result, selected, onToggle }) {
  const { entry, matchedForm, quote } = result
  const isDifferent = matchedForm.toLowerCase() !== entry.title.toLowerCase()
  return (
    <div className={`bo-scan-result${selected ? ' bo-scan-result--selected' : ''}`} onClick={onToggle}>
      <div className="bo-scan-result-header">
        <input type="checkbox" checked={selected} onChange={onToggle} onClick={e => e.stopPropagation()} />
        <strong>{entry.title}</strong>
        {isDifferent && <span className="bo-scan-form"> ({matchedForm})</span>}
        <span className="bo-scan-hash">{entry.hash}</span>
      </div>
      <blockquote className="bo-scan-quote">{quote}</blockquote>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BackofficePage({ repository, etymologyStore, loc }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const startView = location.state?.startView

  const [drafts, setDrafts]         = useState(() => getDrafts())
  const [view, setView]             = useState(() => {
    if (startView === 'scanner')     return 'scanner'
    if (startView === 'new')         return 'form'
    if (startView === 'etymologies') return 'etymologies'
    if (startView === 'ngbe')        return 'ngbe'
    return 'list'
  })
  const initialForm = startView === 'new' ? { ...EMPTY_FORM(), draftId: newDraftId() } : EMPTY_FORM()
  const [form, setForm]             = useState(initialForm)
  const [isDrawing, setIsDrawing]   = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [error, setError]           = useState('')
  const [bulkText, setBulkText]     = useState('')
  const [showBulk, setShowBulk]     = useState(false)

  // ── Etymology management ─────────────────────────────────────────────────────
  const [draftEtyms, setDraftEtyms]     = useState(() => getDraftEtymologies())
  const [etymSubview, setEtymSubview]   = useState('list')
  const [etymForm, setEtymForm]         = useState(EMPTY_ETYM_FORM)

  // ── NGBE import wizard ───────────────────────────────────────────────────────
  const [ngbeQuery,      setNgbeQuery]      = useState('')
  const [ngbeResults,    setNgbeResults]    = useState([])
  const [ngbeLoading,    setNgbeLoading]    = useState(false)
  const [ngbeCategories, setNgbeCategories] = useState([])  // [{code, label, count}]
  const [ngbeSelected,   setNgbeSelected]   = useState(new Set())
  const [ngbeStep,       setNgbeStep]       = useState(1)
  const [ngbeEtymId,     setNgbeEtymId]     = useState(null)
  const [ngbeCodeFilter,    setNgbeCodeFilter]    = useState(new Set()) // empty = all
  const [ngbeGroupsOpen,    setNgbeGroupsOpen]    = useState(new Set())  // collapsed by default
  const [ngbeImporting,     setNgbeImporting]     = useState(false)
  const [ngbeOsmCache,      setNgbeOsmCache]      = useState({}) // id → null|'loading'|{type,coordinates}

  // ── Search existing ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = searchQuery.trim().length >= 2
    ? (repository?.getFromQueryString(searchQuery, false) || []).slice(0, 8)
    : []

  // ── Map bounds (for scanner filtering) ──────────────────────────────────────
  const [mapBounds, setMapBounds] = useState(null)

  // ── Scanner ─────────────────────────────────────────────────────────────────
  const [scanYear,    setScanYear]    = useState('')
  const [scanSource,  setScanSource]  = useState('')
  const [scanUrl,     setScanUrl]     = useState('')
  const [scanText,    setScanText]    = useState('')
  const [scanResults, setScanResults] = useState([])
  const [scanSelected, setScanSelected] = useState(new Set())
  // Manual link submode
  const [scanManual,       setScanManual]       = useState(false)
  const [scanSelection,    setScanSelection]    = useState('')
  const [scanManualTopo,   setScanManualTopo]   = useState(null)   // topo entry
  const [scanManualSearch, setScanManualSearch] = useState('')

  const knownTags = loc
    ? Object.keys(loc.repository).filter(k => k.startsWith('tag_')).map(k => k.slice(4))
    : []

  // ── Draft CRUD ──────────────────────────────────────────────────────────────
  const refreshDrafts = () => setDrafts(getDrafts())

  const handleNew = () => {
    setForm({ ...EMPTY_FORM(), draftId: newDraftId() })
    setCurrentPoints([])
    setIsDrawing(false)
    setError('')
    setView('form')
  }

  const handleEdit = (draft) => {
    setForm({ ...draft })
    setCurrentPoints(draft.coordinates || [])
    setIsDrawing(false)
    setError('')
    setView('form')
  }

  const handleEditExisting = (topo) => {
    const existingDraft = drafts.find(d => d.hash === topo.hash)
    if (existingDraft) { handleEdit(existingDraft); return }
    setForm({
      draftId:      newDraftId(),
      hash:         topo.hash,
      name:         topo.title,
      vernacular:   topo.vernacular || '',
      type:         topo.type,
      coordinates:  topo.coordinates || [],
      tags:         topo.tags || [],
      attestations: topo.attestations || [],
      etymology_ids: topo.etymology_ids || [],
      notes:        topo.notes || '',
    })
    setCurrentPoints(topo.coordinates || [])
    setIsDrawing(false)
    setError('')
    setSearchQuery('')
    setView('form')
  }

  const handleDelete = (draftId) => {
    deleteDraft(draftId)
    refreshDrafts()
  }

  const handleCancel = () => {
    setIsDrawing(false)
    setCurrentPoints([])
    setView('list')
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    saveDraft({ ...form, coordinates: currentPoints })
    refreshDrafts()
    setIsDrawing(false)
    setCurrentPoints([])
    setView('list')
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const handleAddPoint = useCallback((latlng) => {
    if (form.type === 'point') {
      setCurrentPoints([latlng])
      setIsDrawing(false)
    } else {
      setCurrentPoints(prev => [...prev, latlng])
    }
  }, [form.type])

  const handleFinishDrawing = () => setIsDrawing(false)
  const handleClearDrawing  = () => { setCurrentPoints([]); setIsDrawing(false) }
  const handleStartDrawing  = () => { setCurrentPoints([]); setIsDrawing(true) }

  const setType = (type) => {
    setForm(f => ({ ...f, type }))
    setCurrentPoints([])
    setIsDrawing(false)
  }

  // ── Attestations ────────────────────────────────────────────────────────────
  const addAttestation = () =>
    setForm(f => ({ ...f, attestations: [...f.attestations, EMPTY_ATTESTATION()] }))

  const updateAttestation = (i, att) =>
    setForm(f => ({ ...f, attestations: f.attestations.map((a, idx) => idx === i ? att : a) }))

  const removeAttestation = (i) =>
    setForm(f => ({ ...f, attestations: f.attestations.filter((_, idx) => idx !== i) }))

  const addAttestationFromTemplate = (template) =>
    setForm(f => ({ ...f, attestations: [...f.attestations, { ...EMPTY_ATTESTATION(), year: template.year, source: template.source, url: template.url || '' }] }))

  const parseBulkImport = () => {
    const newAtts = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const [year = '', highlight = '', source = '', quote = '', url = ''] = line.split('|').map(p => p.trim())
        return { year, highlight, source, quote, url }
      })
      .filter(a => a.year || a.highlight)
    if (!newAtts.length) return
    setForm(f => ({ ...f, attestations: [...f.attestations, ...newAtts] }))
    setBulkText('')
    setShowBulk(false)
  }

  // ── NGBE API helpers ─────────────────────────────────────────────────────────
  // Fetch available categories from ArcGIS when NGBE view opens
  useEffect(() => {
    if (view !== 'ngbe' || ngbeCategories.length > 0) return
    const stats = encodeURIComponent(JSON.stringify([{ statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'n' }]))
    const params = `f=json&where=1%3D1&outFields=CLASIFICACION_SECUNDARIA&returnGeometry=false&groupByFieldsForStatistics=CLASIFICACION_SECUNDARIA&outStatistics=${stats}&orderByFields=CLASIFICACION_SECUNDARIA`
    fetch(`${NGBE_URL}?${params}`)
      .then(r => r.json())
      .then(data => {
        const cats = (data.features || []).map(f => ({
          code:  f.attributes.CLASIFICACION_SECUNDARIA,
          label: NGBE_CAT_LABELS[f.attributes.CLASIFICACION_SECUNDARIA] || f.attributes.CLASIFICACION_SECUNDARIA,
          count: f.attributes.n,
        })).sort((a, b) => a.code.localeCompare(b.code))
        setNgbeCategories(cats)
      })
      .catch(() => {})
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search ArcGIS when query changes (debounced 400 ms)
  useEffect(() => {
    const q = ngbeQuery.trim()
    if (q.length < 2) { setNgbeResults([]); return }
    const timer = setTimeout(() => {
      setNgbeLoading(true)
      const where = encodeURIComponent(`UPPER(IDENTIFICADOR_GEOGRAFICO) LIKE UPPER('${q.replace(/'/g, "''")}%')`)
      const params = `f=json&where=${where}&outFields=OBJECTID,IDENTIFICADOR_GEOGRAFICO,MUNICIPIO,CODIGO_NGBE,CLASIFICACION_SECUNDARIA&returnGeometry=true&outSR=4326&resultRecordCount=150&orderByFields=IDENTIFICADOR_GEOGRAFICO+ASC`
      fetch(`${NGBE_URL}?${params}`)
        .then(r => r.json())
        .then(data => {
          setNgbeResults((data.features || []).map(f => ({
            id:   f.attributes.OBJECTID,
            name: f.attributes.IDENTIFICADOR_GEOGRAFICO,
            lat:  f.geometry?.y ? parseFloat(f.geometry.y.toFixed(6)) : null,
            lng:  f.geometry?.x ? parseFloat(f.geometry.x.toFixed(6)) : null,
            mun:  f.attributes.MUNICIPIO ?? '',
            code: f.attributes.CODIGO_NGBE ?? '',
            cat:  f.attributes.CLASIFICACION_SECUNDARIA ?? '',
          })).filter(e => e.lat && e.lng))
        })
        .catch(() => setNgbeResults([]))
        .finally(() => setNgbeLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [ngbeQuery])

  // ── Etymology management handlers ────────────────────────────────────────────
  const refreshDraftEtyms = () => setDraftEtyms(getDraftEtymologies())

  const handleNewEtym = () => {
    setEtymForm(EMPTY_ETYM_FORM)
    setEtymSubview('form')
  }

  const handleEditEtym = (etym) => {
    setEtymForm({ id: etym.id, origin: etym.origin || '', meaning: etym.meaning || '', notes: etym.notes || '', tags: etym.tags || '' })
    setEtymSubview('form')
  }

  const handleSaveEtym = () => {
    if (!etymForm.origin.trim()) return
    const id = etymForm.id || newDraftEtymId()
    saveDraftEtymology({ ...etymForm, id })
    refreshDraftEtyms()
    setEtymSubview('list')
  }

  const handleDeleteEtym = (id) => {
    deleteDraftEtymology(id)
    refreshDraftEtyms()
  }

  // ── NGBE import wizard handlers ──────────────────────────────────────────────

  // Build a Set of existing names (committed + drafts) for deduplication
  const existingNames = new Set([
    ...(repository?.getAllEntries() || []).map(e => e.title?.toLowerCase()),
    ...drafts.map(d => d.name?.toLowerCase()),
  ])

  // Filter displayed results by selected categories
  const ngbeVisible = ngbeCodeFilter.size === 0
    ? ngbeResults
    : ngbeResults.filter(e => ngbeCodeFilter.has(e.cat))

  const toggleNgbeCode = (code) => {
    setNgbeCodeFilter(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  // Clear OSM geometry cache when search results change
  useEffect(() => { setNgbeOsmCache({}) }, [ngbeResults])

  const toggleNgbeItem = (id) => {
    const isSelecting = !ngbeSelected.has(id)
    setNgbeSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    // On select: fetch OSM geometry if category has real geometry (rivers, beaches, etc.)
    if (isSelecting && !(id in ngbeOsmCache)) {
      const entry = ngbeResults.find(e => e.id === id)
      if (entry && OSM_GEO[entry.cat]) {
        setNgbeOsmCache(p => ({ ...p, [id]: 'loading' }))
        fetchOsmGeometry(entry.name, entry.cat)
          .then(geom => {
            if (geom) {
              const first = geom.coordinates[0]
              const last  = geom.coordinates[geom.coordinates.length - 1]
              const dist  = Math.hypot(first[0] - last[0], first[1] - last[1])
              console.log('[OSM geom]', entry.name, entry.cat, geom.type, geom.coordinates.length, 'pts', '| first↔last dist:', dist.toFixed(5))
            } else {
              console.log('[OSM geom]', entry.name, entry.cat, 'null')
            }
            setNgbeOsmCache(p => ({ ...p, [id]: geom }))
          })
          .catch(err => {
            console.warn('[OSM geom] error', entry.name, err)
            setNgbeOsmCache(p => ({ ...p, [id]: null }))
          })
      }
    }
  }

  const toggleAllNgbe = () => {
    if (ngbeSelected.size === ngbeVisible.length) setNgbeSelected(new Set())
    else setNgbeSelected(new Set(ngbeVisible.map(e => e.id)))
  }

  const importNgbeSelected = async () => {
    const selected = ngbeResults.filter(e => ngbeSelected.has(e.id))
    setNgbeImporting(true)
    await new Promise(r => setTimeout(r, 0)) // let React paint the loading state
    try {
      const geoResults = await Promise.all(selected.map(e => fetchOsmGeometry(e.name, e.cat)))
      selected.forEach((entry, i) => {
        const osm = geoResults[i]
        saveDraft({
          draftId:       newDraftId(),
          hash:          null,
          name:          entry.name,
          vernacular:    '',
          type:          osm?.type ?? 'point',
          coordinates:   osm?.coordinates ?? [[entry.lat, entry.lng]],
          tags:          [],
          attestations:  [],
          etymology_ids: ngbeEtymId ? [ngbeEtymId] : [],
          notes:         osm ? 'Geometría importada desde OpenStreetMap.' : '',
        })
      })
      refreshDrafts()
      setNgbeSelected(new Set())
      setNgbeQuery('')
      setNgbeResults([])
      setNgbeStep(1)
      setNgbeEtymId(null)
      setView('list')
    } finally {
      setNgbeImporting(false)
    }
  }

  // ── Scanner ─────────────────────────────────────────────────────────────────
  const runScanner = () => {
    let entries = repository?.getAllEntries() || []
    if (mapBounds) {
      entries = entries.filter(e => {
        const coords = e.coordinates || []
        return coords.some(([lat, lng]) => mapBounds.contains([lat, lng]))
      })
    }
    const results = scanTextForToponyms(scanText, entries)
    setScanResults(results)
    setScanSelected(new Set(results.map((_, i) => i)))
  }

  const toggleScanResult = (i) => {
    setScanSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAllScanResults = () => {
    if (scanSelected.size === scanResults.length) setScanSelected(new Set())
    else setScanSelected(new Set(scanResults.map((_, i) => i)))
  }

  const createDraftsFromScan = () => {
    const att = { year: scanYear, highlight: '', source: scanSource, quote: '', url: scanUrl }
    const currentDrafts = getDrafts()

    scanResults.forEach((result, i) => {
      if (!scanSelected.has(i)) return
      const { entry, matchedForm, quote } = result
      const thisAtt = { ...att, highlight: matchedForm, quote }
      const existing = currentDrafts.find(d => d.hash === entry.hash)

      if (existing) {
        saveDraft({ ...existing, attestations: [...(existing.attestations || []), thisAtt] })
      } else {
        saveDraft({
          draftId:      newDraftId(),
          hash:         entry.hash,
          name:         entry.title,
          vernacular:   entry.vernacular || '',
          type:         entry.type,
          coordinates:  entry.coordinates || [],
          tags:         entry.tags || [],
          attestations: [thisAtt],
          etymology_ids: entry.etymology_ids || [],
          notes:        entry.notes || '',
        })
      }
      // update currentDrafts so newDraftId() stays in sync
      currentDrafts.length = 0
      currentDrafts.push(...getDrafts())
    })

    refreshDrafts()
    setScanResults([])
    setScanSelected(new Set())
    setView('list')
  }

  // ── Manual scanner link ──────────────────────────────────────────────────────
  const manualSearchResults = scanManualSearch.trim().length >= 2
    ? (repository?.getFromQueryString(scanManualSearch, false) || []).slice(0, 8)
    : []

  const addManualAttestation = () => {
    if (!scanManualTopo || !scanSelection.trim()) return
    const att = { year: scanYear, highlight: scanSelection, source: scanSource, quote: scanSelection, url: scanUrl }
    const entry = scanManualTopo
    const currentDrafts = getDrafts()
    const existing = currentDrafts.find(d => d.hash === entry.hash)
    if (existing) {
      saveDraft({ ...existing, attestations: [...(existing.attestations || []), att] })
    } else {
      saveDraft({
        draftId:      newDraftId(),
        hash:         entry.hash,
        name:         entry.title,
        vernacular:   entry.vernacular || '',
        type:         entry.type,
        coordinates:  entry.coordinates || [],
        tags:         entry.tags || [],
        attestations: [att],
        etymology_ids: entry.etymology_ids || [],
        notes:        entry.notes || '',
      })
    }
    refreshDrafts()
    setScanSelection('')
    setScanManualTopo(null)
    setScanManualSearch('')
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const content = exportDrafts(drafts)
    const blob = new Blob([content], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'nuevos-toponimos.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Coordinates display ─────────────────────────────────────────────────────
  const coordsLabel = (() => {
    if (!currentPoints.length) return 'Sin coordenadas'
    if (form.type === 'point') return `${currentPoints[0][0].toFixed(5)}, ${currentPoints[0][1].toFixed(5)}`
    return `${currentPoints.length} vértice${currentPoints.length !== 1 ? 's' : ''}`
  })()

  const canFinish = (form.type === 'line' && currentPoints.length >= 2)
                 || (form.type === 'poly' && currentPoints.length >= 3)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bo-layout">
      <Navbar fixed="top" bg="dark" variant="dark" className="bo-navbar">
        <button className="bo-back-btn" onClick={() => navigate(ROUTE_BACKOFFICE)}>←</button>
        <Navbar.Brand className="bo-brand">Editor de topónimos</Navbar.Brand>
      </Navbar>

      <div className="bo-body">
        {/* ── LEFT PANEL ── */}
        <div className="bo-panel">

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              <div className="bo-panel-header">
                <button className="bo-btn bo-btn-primary" onClick={handleNew}>+ Nuevo</button>
                <button className="bo-btn" onClick={() => { setScanResults([]); setScanSelected(new Set()); setView('scanner') }}>
                  ⌕ Escanear texto
                </button>
                {drafts.length > 0 && (
                  <button className="bo-btn" onClick={handleExport}>↓ Exportar</button>
                )}
              </div>

              {/* Search existing toponyms */}
              <div className="bo-search-existing">
                <input
                  className="bo-input"
                  placeholder="Buscar topónimo existente para editar…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="bo-search-results">
                    {searchResults.map(t => (
                      <button key={t.hash} className="bo-search-result-item"
                        onClick={() => handleEditExisting(t)}>
                        <span className="bo-search-result-name">{t.title}</span>
                        <span className="bo-search-result-hash">{t.hash}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Draft list */}
              {drafts.length === 0 ? (
                <p className="bo-empty">Sin borradores guardados.</p>
              ) : (
                <div className="bo-draft-list">
                  {drafts.map(d => (
                    <DraftItem key={d.draftId} draft={d}
                      onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── FORM VIEW ── */}
          {view === 'form' && (
            <div className="bo-form">
              {form.hash && (
                <div className="bo-edit-notice">
                  Editando topónimo existente · <code>{form.hash}</code>
                </div>
              )}

              {/* Nombre */}
              <div className="bo-form-section">
                <label className="bo-label">Nombre <span className="bo-required">*</span></label>
                <input className={`bo-input${error ? ' bo-input-error' : ''}`}
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError('') }}
                  placeholder="Nombre del topónimo"
                />
                {error && <span className="bo-error">{error}</span>}
              </div>

              {/* Forma patrimonial */}
              <div className="bo-form-section">
                <label className="bo-label">Forma patrimonial <span className="bo-optional">(opcional)</span></label>
                <input className="bo-input"
                  value={form.vernacular || ''}
                  onChange={e => setForm(f => ({ ...f, vernacular: e.target.value }))}
                  placeholder="Forma dialectal o popular, si difiere del nombre oficial"
                />
              </div>

              {/* Tipo */}
              <div className="bo-form-section">
                <label className="bo-label">Tipo</label>
                <div className="bo-type-btns">
                  {['point', 'line', 'poly'].map(t => (
                    <button key={t}
                      className={`bo-type-btn${form.type === t ? ' active' : ''}`}
                      onClick={() => setType(t)}>
                      {{ point: 'Punto', line: 'Línea', poly: 'Área' }[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometría */}
              <div className="bo-form-section">
                <label className="bo-label">Geometría</label>
                <div className="bo-draw-row">
                  {!isDrawing ? (
                    <button className="bo-btn bo-btn-primary" onClick={handleStartDrawing}>
                      ✎ Marcar en mapa
                    </button>
                  ) : (
                    <>
                      {(form.type === 'line' || form.type === 'poly') && (
                        <button className="bo-btn bo-btn-primary"
                          disabled={!canFinish} onClick={handleFinishDrawing}>
                          ✓ Finalizar
                        </button>
                      )}
                      <button className="bo-btn" onClick={handleClearDrawing}>✕ Limpiar</button>
                    </>
                  )}
                </div>
                <span className="bo-coords-label">{coordsLabel}</span>
                {isDrawing && (
                  <p className="bo-draw-hint">
                    {form.type === 'point'
                      ? 'Haz clic en el mapa para colocar el punto.'
                      : 'Haz clic para añadir vértices. Pulsa "Finalizar" cuando termines.'}
                  </p>
                )}
              </div>

              {/* Etiquetas */}
              <div className="bo-form-section">
                <label className="bo-label">Etiquetas</label>
                <TagInput
                  tags={form.tags}
                  knownTags={knownTags}
                  loc={loc}
                  onChange={tags => setForm(f => ({ ...f, tags }))}
                />
              </div>

              {/* Atestaciones */}
              <div className="bo-form-section">
                <label className="bo-label">Atestaciones</label>
                {form.attestations.map((att, i) => (
                  <AttestationRow key={i} att={att}
                    onChange={updated => updateAttestation(i, updated)}
                    onRemove={() => removeAttestation(i)} />
                ))}
                <div className="bo-att-actions">
                  <button className="bo-btn bo-btn-sm" onClick={addAttestation}>+ Vacía</button>
                  {SOURCE_TEMPLATES.map(t => (
                    <button key={t.label} className="bo-btn bo-btn-sm bo-btn-template"
                      onClick={() => addAttestationFromTemplate(t)}>
                      + {t.label}
                    </button>
                  ))}
                  <button className="bo-btn bo-btn-sm" onClick={() => setShowBulk(b => !b)}>
                    {showBulk ? '× Cerrar' : '↓ Varias a la vez'}
                  </button>
                </div>
                {showBulk && (
                  <div className="bo-bulk-import">
                    <p className="bo-bulk-hint">Una por línea: <code>AÑO | FORMA | FUENTE | CITA | URL</code></p>
                    <textarea
                      className="bo-input bo-textarea"
                      rows={5}
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      placeholder={'1749 | Abanillas | Catastro de Ensenada\n1352 | Abanyllas | Becerro de Behetrías | en término de Abanyllas...'}
                    />
                    <div className="bo-bulk-actions">
                      <button className="bo-btn bo-btn-primary bo-btn-sm"
                        disabled={!bulkText.trim()} onClick={parseBulkImport}>
                        Parsear e importar
                      </button>
                      <button className="bo-btn bo-btn-sm"
                        onClick={() => { setShowBulk(false); setBulkText('') }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Etimología */}
              <div className="bo-form-section">
                <label className="bo-label">Etimología</label>
                <EtymologySelector
                  etymology_ids={form.etymology_ids || []}
                  etymologyStore={etymologyStore}
                  onChange={etymology_ids => setForm(f => ({ ...f, etymology_ids }))}
                />
              </div>

              {/* Notas */}
              <div className="bo-form-section">
                <label className="bo-label">Notas <span className="bo-optional">(opcional)</span></label>
                <textarea className="bo-input bo-textarea" rows={4}
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Evolución fonética, contexto histórico…"
                />
              </div>

              <div className="bo-form-actions">
                <button className="bo-btn bo-btn-primary" onClick={handleSave}>Guardar</button>
                <button className="bo-btn" onClick={handleCancel}>Cancelar</button>
              </div>
            </div>
          )}

          {/* ── SCANNER VIEW ── */}
          {view === 'scanner' && (
            <div className="bo-form">
              <div className="bo-scanner-header">
                <h3 className="bo-scanner-title">Escanear texto histórico</h3>
                <p className="bo-scanner-desc">
                  Pega un fragmento de documento. El sistema detecta qué topónimos del índice aparecen en él
                  y te permite crear borradores con la cita en contexto.
                </p>
              </div>

              <div className="bo-form-section">
                <label className="bo-label">Fuente</label>
                <input
                  list="bo-source-list"
                  className="bo-input"
                  value={scanSource}
                  onChange={e => {
                    const val = e.target.value
                    setScanSource(val)
                    const match = SOURCE_TEMPLATES.find(t => t.source === val)
                    if (match) {
                      if (!scanYear) setScanYear(match.year)
                      if (!scanUrl && match.url) setScanUrl(match.url)
                    }
                  }}
                  placeholder="Catastro de Ensenada"
                />
              </div>
              <div className="bo-form-section">
                <label className="bo-label">Año</label>
                <input className="bo-input" value={scanYear}
                  onChange={e => setScanYear(e.target.value)} placeholder="1749" />
              </div>
              <div className="bo-form-section">
                <label className="bo-label">URL <span className="bo-optional">(opcional)</span></label>
                <input className="bo-input" value={scanUrl}
                  onChange={e => setScanUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="bo-form-section">
                <label className="bo-label">Texto del documento</label>
                <textarea className="bo-input bo-textarea" rows={8} value={scanText}
                  onChange={e => { setScanText(e.target.value); setScanResults([]) }}
                  placeholder="Pega aquí el texto histórico…" />
              </div>

              <div className="bo-scanner-actions">
                <button className="bo-btn bo-btn-primary"
                  disabled={!scanText.trim()} onClick={runScanner}>
                  ⌕ Escanear
                </button>
                <button className="bo-btn" onClick={() => setView('list')}>← Volver</button>
              </div>

              {scanResults.length > 0 && !scanManual && (
                <div className="bo-scan-results-wrap">
                  <div className="bo-scan-results-header">
                    <span>{scanResults.length} coincidencia{scanResults.length !== 1 ? 's' : ''}</span>
                    <button className="bo-btn bo-btn-sm" onClick={toggleAllScanResults}>
                      {scanSelected.size === scanResults.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>
                  {scanResults.map((r, i) => (
                    <ScanResult key={i} result={r}
                      selected={scanSelected.has(i)} onToggle={() => toggleScanResult(i)} />
                  ))}
                  <div className="bo-scanner-actions" style={{ marginTop: '0.75rem' }}>
                    <button className="bo-btn bo-btn-primary"
                      disabled={scanSelected.size === 0} onClick={createDraftsFromScan}>
                      Crear borradores ({scanSelected.size})
                    </button>
                    <button className="bo-btn" onClick={() => { setScanManual(true); setScanSelection(''); setScanManualTopo(null) }}>
                      ✎ Enlazar citas manualmente
                    </button>
                  </div>
                </div>
              )}

              {/* ── Manual link mode ── */}
              {scanManual && (
                <div className="bo-scan-manual">
                  <div className="bo-scan-manual-header">
                    <span className="bo-scanner-title">Enlazar citas manualmente</span>
                    <button className="bo-btn bo-btn-sm" onClick={() => { setScanManual(false); setScanSelection('') }}>← Volver</button>
                  </div>
                  <p className="bo-scanner-desc">
                    Selecciona una parte del texto con el ratón. Aparecerá aquí para que la vincules a un topónimo.
                  </p>
                  <div
                    className="bo-scan-text-display"
                    onMouseUp={() => {
                      const sel = window.getSelection()?.toString().trim()
                      if (sel) setScanSelection(sel)
                    }}
                  >
                    {scanText}
                  </div>

                  {scanSelection && (
                    <div className="bo-scan-manual-form">
                      <label className="bo-label">Cita seleccionada</label>
                      <blockquote className="bo-scan-quote">{scanSelection}</blockquote>

                      <label className="bo-label">Topónimo</label>
                      <input
                        className="bo-input"
                        placeholder="Buscar topónimo…"
                        value={scanManualSearch}
                        onChange={e => { setScanManualSearch(e.target.value); setScanManualTopo(null) }}
                      />
                      {manualSearchResults.length > 0 && !scanManualTopo && (
                        <div className="bo-search-results">
                          {manualSearchResults.map(t => (
                            <button key={t.hash} className="bo-search-result-item"
                              onClick={() => { setScanManualTopo(t); setScanManualSearch(t.title) }}>
                              <span className="bo-search-result-name">{t.title}</span>
                              <span className="bo-search-result-hash">{t.hash}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="bo-scanner-actions" style={{ marginTop: '0.5rem' }}>
                        <button className="bo-btn bo-btn-primary"
                          disabled={!scanManualTopo} onClick={addManualAttestation}>
                          Añadir atestación
                        </button>
                        <button className="bo-btn bo-btn-sm" onClick={() => { setScanSelection(''); setScanManualTopo(null); setScanManualSearch('') }}>
                          Limpiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {scanResults.length === 0 && scanText.trim() && !scanManual && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p className="bo-empty">Pulsa "Escanear" para buscar coincidencias.</p>
                  {scanText.trim() && (
                    <button className="bo-btn bo-btn-sm" style={{ marginTop: '0.3rem' }}
                      onClick={() => { setScanManual(true); setScanSelection(''); setScanManualTopo(null) }}>
                      ✎ Enlazar citas manualmente
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ── ETYMOLOGIES VIEW ── */}
          {view === 'etymologies' && (
            <>
              {etymSubview === 'list' && (
                <>
                  <div className="bo-panel-header">
                    <button className="bo-btn bo-btn-primary" onClick={handleNewEtym}>+ Nueva</button>
                    <button className="bo-btn" onClick={() => setView('list')}>← Volver</button>
                  </div>

                  {/* Draft etymologies */}
                  {draftEtyms.length > 0 && (
                    <div className="bo-etym-section">
                      <h4 className="bo-etym-section-title">Borradores</h4>
                      {draftEtyms.map(e => (
                        <div key={e.id} className="bo-etym-list-item">
                          <div className="bo-etym-list-body">
                            <strong>{e.origin}</strong>
                            {e.meaning && <span className="bo-etym-meaning"> — {e.meaning}</span>}
                            {e.notes && <p className="bo-etym-notes">{e.notes}</p>}
                          </div>
                          <div className="bo-etym-list-actions">
                            <button className="bo-btn bo-btn-sm" onClick={() => handleEditEtym(e)}>Editar</button>
                            <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => handleDeleteEtym(e.id)}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Committed etymologies */}
                  {(etymologyStore?.byId?.size ?? 0) > 0 && (
                    <div className="bo-etym-section">
                      <h4 className="bo-etym-section-title">En el índice</h4>
                      {Array.from(etymologyStore.byId.values()).map(e => (
                        <div key={e.id} className="bo-etym-list-item bo-etym-list-item--committed">
                          <div className="bo-etym-list-body">
                            <strong>{e.origin}</strong>
                            {e.meaning && <span className="bo-etym-meaning"> — {e.meaning}</span>}
                            {e.notes && <p className="bo-etym-notes">{e.notes}</p>}
                          </div>
                          <span className="bo-etym-committed-badge">{e.id}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {draftEtyms.length === 0 && (etymologyStore?.byId?.size ?? 0) === 0 && (
                    <p className="bo-empty">Sin etimologías todavía.</p>
                  )}
                </>
              )}

              {etymSubview === 'form' && (
                <div className="bo-form">
                  <div className="bo-form-section">
                    <label className="bo-label">Origen <span className="bo-required">*</span></label>
                    <input className="bo-input" placeholder="p.ej. CASTELLUM, aqua, valle…"
                      value={etymForm.origin}
                      onChange={e => setEtymForm(f => ({ ...f, origin: e.target.value }))} />
                  </div>
                  <div className="bo-form-section">
                    <label className="bo-label">Significado <span className="bo-optional">(opcional)</span></label>
                    <input className="bo-input" placeholder="traducción o glosa"
                      value={etymForm.meaning}
                      onChange={e => setEtymForm(f => ({ ...f, meaning: e.target.value }))} />
                  </div>
                  <div className="bo-form-section">
                    <label className="bo-label">Notas <span className="bo-optional">(opcional)</span></label>
                    <textarea className="bo-input bo-textarea" rows={4}
                      placeholder="Evolución fonética, referencias bibliográficas, cognados…"
                      value={etymForm.notes}
                      onChange={e => setEtymForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="bo-form-section">
                    <label className="bo-label">Etiquetas <span className="bo-optional">(opcional)</span></label>
                    <input className="bo-input" placeholder="latín, prerromano, hidronímico…"
                      value={etymForm.tags}
                      onChange={e => setEtymForm(f => ({ ...f, tags: e.target.value }))} />
                  </div>
                  <div className="bo-form-actions">
                    <button className="bo-btn bo-btn-primary"
                      disabled={!etymForm.origin.trim()} onClick={handleSaveEtym}>
                      Guardar
                    </button>
                    {etymForm.id && (
                      <button className="bo-btn bo-btn-danger"
                        onClick={() => { handleDeleteEtym(etymForm.id); setEtymSubview('list') }}>
                        Eliminar
                      </button>
                    )}
                    <button className="bo-btn" onClick={() => setEtymSubview('list')}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── NGBE IMPORT WIZARD ── */}
          {view === 'ngbe' && (
            <div className="bo-form">
              <div className="bo-scanner-header">
                <h3 className="bo-scanner-title">Importar del NGBE</h3>
                <p className="bo-scanner-desc">
                  Busca topónimos en la base cartográfica por prefijo y selecciona los que quieres importar.
                </p>
              </div>

              {/* Step indicator */}
              <div className="bo-wizard-steps">
                <span className={`bo-wizard-step${ngbeStep === 1 ? ' active' : ''}`}>1 Seleccionar</span>
                <span className="bo-wizard-arrow">→</span>
                <span className={`bo-wizard-step${ngbeStep === 2 ? ' active' : ''}`}>2 Etimología</span>
              </div>

              {/* ── Step 1: search + select ── */}
              {ngbeStep === 1 && (
                <>
                  <div className="bo-form-section">
                    <label className="bo-label">Buscar por prefijo</label>
                    <input
                      className="bo-input"
                      placeholder="Llan, Val, San, Río…"
                      value={ngbeQuery}
                      onChange={e => setNgbeQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Category filter chips — grouped + collapsible, loaded from ArcGIS schema */}
                  {ngbeCategories.length > 0 && (() => {
                    const groups = {}
                    ngbeCategories.forEach(cat => {
                      const g = cat.code.split('.')[0]
                      if (!groups[g]) groups[g] = []
                      groups[g].push(cat)
                    })
                    const toggleGroup = (g) => setNgbeGroupsOpen(prev => {
                      const next = new Set(prev)
                      next.has(g) ? next.delete(g) : next.add(g)
                      return next
                    })
                    return (
                      <div style={{ marginBottom: '0.6rem' }}>
                        {Object.entries(groups).map(([g, cats]) => {
                          const open = ngbeGroupsOpen.has(g)
                          const activeInGroup = cats.filter(c => ngbeCodeFilter.has(c.code)).length
                          return (
                            <div key={g} className="bo-ngbe-filter-group">
                              <button className="bo-ngbe-filter-group-toggle" onClick={() => toggleGroup(g)}>
                                <span className="bo-ngbe-filter-group-arrow">{open ? '▾' : '▸'}</span>
                                <span className="bo-ngbe-filter-group-label">{NGBE_GROUP_LABELS[g] || `Grupo ${g}`}</span>
                                {activeInGroup > 0 && (
                                  <span className="bo-ngbe-filter-group-active">{activeInGroup} seleccionado{activeInGroup !== 1 ? 's' : ''}</span>
                                )}
                              </button>
                              {open && (
                                <div className="bo-ngbe-filters">
                                  {cats.map(({ code, label, count }) => (
                                    <button
                                      key={code}
                                      className={`bo-ngbe-filter-chip${ngbeCodeFilter.size === 0 || ngbeCodeFilter.has(code) ? ' active' : ''}`}
                                      onClick={() => toggleNgbeCode(code)}
                                    >
                                      {label} <span className="bo-ngbe-filter-count">{count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {ngbeLoading && <p className="bo-empty">Buscando…</p>}

                  {!ngbeLoading && ngbeVisible.length > 0 && (
                    <div className="bo-ngbe-results">
                      <div className="bo-ngbe-results-header">
                        <span>{ngbeVisible.length} resultado{ngbeVisible.length !== 1 ? 's' : ''}{ngbeResults.length > ngbeVisible.length ? ` (${ngbeResults.length} total)` : ''}</span>
                        <button className="bo-btn bo-btn-sm" onClick={toggleAllNgbe}>
                          {ngbeSelected.size === ngbeVisible.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        </button>
                      </div>
                      {ngbeVisible.map(e => {
                        const alreadyExists = existingNames.has(e.name.toLowerCase())
                        const osmState = ngbeSelected.has(e.id) ? ngbeOsmCache[e.id] : undefined
                        return (
                          <label key={e.id} className={`bo-ngbe-item${ngbeSelected.has(e.id) ? ' selected' : ''}${alreadyExists ? ' exists' : ''}`}>
                            <input type="checkbox" checked={ngbeSelected.has(e.id)}
                              onChange={() => toggleNgbeItem(e.id)} />
                            <span className="bo-ngbe-name">{e.name}</span>
                            {alreadyExists && <span className="bo-ngbe-exists-badge">ya importado</span>}
                            {osmState === 'loading' && <span className="bo-ngbe-geom-loading">⟳ geo…</span>}
                            <span className="bo-ngbe-mun">{NGBE_CAT_LABELS[e.cat] || e.cat}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {!ngbeLoading && ngbeQuery.trim().length >= 2 && ngbeVisible.length === 0 && (
                    <p className="bo-empty">Sin resultados para "{ngbeQuery}".</p>
                  )}

                  <div className="bo-scanner-actions">
                    <button className="bo-btn bo-btn-primary"
                      disabled={ngbeSelected.size === 0 || [...ngbeSelected].some(id => ngbeOsmCache[id] === 'loading')}
                      onClick={() => setNgbeStep(2)}>
                      {[...ngbeSelected].some(id => ngbeOsmCache[id] === 'loading')
                        ? 'Cargando geometría…'
                        : `Siguiente → (${ngbeSelected.size})`}
                    </button>
                    <button className="bo-btn" onClick={() => { setNgbeQuery(''); setNgbeResults([]); setNgbeSelected(new Set()); setView('list') }}>
                      Cancelar
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 2: assign etymology ── */}
              {ngbeStep === 2 && (
                <>
                  <div className="bo-form-section">
                    <label className="bo-label">Topónimos seleccionados ({ngbeSelected.size})</label>
                    <div className="bo-ngbe-selected-list">
                      {ngbeResults.filter(e => ngbeSelected.has(e.id)).map(e => (
                        <span key={e.id} className="bo-ngbe-selected-chip">{e.name}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bo-form-section">
                    <label className="bo-label">Etimología <span className="bo-optional">(opcional)</span></label>
                    <p className="bo-form-hint">Puedes vincular todos los topónimos importados a una etimología existente.</p>
                    <EtymologySelector
                      etymology_ids={ngbeEtymId ? [ngbeEtymId] : []}
                      etymologyStore={etymologyStore}
                      onChange={ids => setNgbeEtymId(ids[ids.length - 1] ?? null)}
                    />
                  </div>

                  <div className="bo-scanner-actions">
                    <button className="bo-btn bo-btn-primary"
                      disabled={ngbeImporting} onClick={importNgbeSelected}>
                      {ngbeImporting
                        ? 'Obteniendo geometría OSM…'
                        : `↓ Importar ${ngbeSelected.size} topónimo${ngbeSelected.size !== 1 ? 's' : ''}`}
                    </button>
                    <button className="bo-btn" disabled={ngbeImporting} onClick={() => setNgbeStep(1)}>← Atrás</button>
                  </div>
                  {!ngbeImporting && (
                    <p className="bo-form-hint" style={{ marginTop: '0.4rem' }}>
                      Para ríos, playas y embalses se buscará la geometría real en OpenStreetMap automáticamente.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

        </div>

        {/* ── MAP ── */}
        <div className="bo-map-wrap">
          <BackofficeMap
            isDrawing={isDrawing}
            drawingType={form.type}
            currentPoints={currentPoints}
            onAddPoint={handleAddPoint}
            drafts={drafts}
            selectedDraftId={view === 'form' ? form.draftId : null}
            onDraftClick={draftId => {
              const d = drafts.find(x => x.draftId === draftId)
              if (d) handleEdit(d)
            }}
            repository={repository}
            onBoundsChange={setMapBounds}
            onTopoClick={hash => {
              const topo = repository?.getFromId(hash)
              if (topo) handleEditExisting(topo)
            }}
            ngbePreview={view === 'ngbe' && ngbeStep === 1 ? ngbeVisible : null}
            ngbeSelectedIds={ngbeSelected}
            onNgbeItemClick={toggleNgbeItem}
            ngbeOsmCache={ngbeOsmCache}
          />
        </div>

        {/* ── Shared datalist for source autocomplete ── */}
        <datalist id="bo-source-list">
          {SOURCE_TEMPLATES.map(t => <option key={t.source} value={t.source} />)}
        </datalist>
      </div>
    </div>
  )
}
