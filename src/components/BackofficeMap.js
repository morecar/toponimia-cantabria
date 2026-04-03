import { useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, useMapEvents, useMap, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import CantabriaColorPane from './CantabriaColorPane'
import { CENTER_CANTABRIA } from '../resources/constants'

const DRAFT_COLOR   = '#f59e0b'
const DRAWING_COLOR = '#2563eb'
const EXISTING_COLOR = '#94a3b8'

// ── Intercepts map clicks when drawing is active ──────────────────────────────
function DrawingEvents({ isDrawing, onAddPoint }) {
  const map = useMap()

  useMapEvents({
    click(e) {
      if (!isDrawing) return
      onAddPoint([e.latlng.lat, e.latlng.lng])
    },
    dblclick(e) {
      // prevent zoom when drawing
      if (isDrawing) e.originalEvent.stopPropagation()
    },
  })

  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = isDrawing ? 'crosshair' : ''
    return () => { container.style.cursor = '' }
  }, [isDrawing, map])

  return null
}

// ── In-progress drawing preview ───────────────────────────────────────────────
function DrawingPreview({ type, points }) {
  if (!points.length) return null
  const opts = { color: DRAWING_COLOR, weight: 2, fillColor: DRAWING_COLOR, fillOpacity: 0.1 }
  return (
    <>
      {points.map((p, i) => (
        <CircleMarker key={i} center={p} radius={5}
          pathOptions={{ color: DRAWING_COLOR, fillColor: DRAWING_COLOR, fillOpacity: 1, weight: 2 }} />
      ))}
      {type === 'line' && points.length > 1 && <Polyline positions={points} pathOptions={opts} />}
      {type === 'poly' && points.length > 2 && <Polygon positions={points} pathOptions={opts} />}
    </>
  )
}

// ── A single saved draft on the map ──────────────────────────────────────────
function DraftShape({ draft, isSelected, onClick }) {
  const opts = {
    color:       isSelected ? '#dc2626' : DRAFT_COLOR,
    fillColor:   isSelected ? '#dc2626' : DRAFT_COLOR,
    fillOpacity: 0.75,
    weight: 2,
  }
  const handlers = { eventHandlers: { click: () => onClick(draft.draftId) } }
  const label = <Tooltip permanent={false}>{draft.name || draft.draftId}</Tooltip>

  if (draft.type === 'point' && draft.coordinates?.[0]) {
    return (
      <CircleMarker center={draft.coordinates[0]} radius={8} pathOptions={opts} {...handlers}>
        {label}
      </CircleMarker>
    )
  }
  if (draft.type === 'line' && draft.coordinates?.length > 1) {
    return (
      <Polyline positions={draft.coordinates}
        pathOptions={{ ...opts, fillOpacity: 0 }} {...handlers}>
        {label}
      </Polyline>
    )
  }
  if (draft.type === 'poly' && draft.coordinates?.length > 2) {
    return (
      <Polygon positions={draft.coordinates}
        pathOptions={{ ...opts, fillOpacity: 0.2 }} {...handlers}>
        {label}
      </Polygon>
    )
  }
  return null
}

// ── Existing toponyms as faint background dots/lines/polys ────────────────────
function ExistingLayer({ repository, onTopoClick }) {
  if (!repository) return null
  const all = repository.database?.value?.() || []
  return (
    <>
      {all.map(t => {
        const opts = { color: EXISTING_COLOR, fillColor: EXISTING_COLOR, fillOpacity: 0.4, weight: 1 }
        const handlers = onTopoClick ? { eventHandlers: { click: () => onTopoClick(t.hash) } } : {}
        if (t.type === 'point' && t.coordinates?.[0])
          return <CircleMarker key={t.hash} center={t.coordinates[0]} radius={5} pathOptions={opts} {...handlers}>
            <Tooltip>{t.title}</Tooltip>
          </CircleMarker>
        if (t.type === 'line' && t.coordinates?.length > 1)
          return <Polyline key={t.hash} positions={t.coordinates} pathOptions={{ ...opts, fillOpacity: 0 }} {...handlers}>
            <Tooltip>{t.title}</Tooltip>
          </Polyline>
        if (t.type === 'poly' && t.coordinates?.length > 2)
          return <Polygon key={t.hash} positions={t.coordinates} pathOptions={{ ...opts, fillOpacity: 0.1 }} {...handlers}>
            <Tooltip>{t.title}</Tooltip>
          </Polygon>
        return null
      })}
    </>
  )
}

// ── Category colour for NGBE preview markers ─────────────────────────────────
function ngbeCatColor(cat) {
  if (!cat) return '#6366f1'
  const g = cat.split('.')[0]
  if (g === '5') return '#0ea5e9'   // rivers / hydrography → blue
  if (g === '4') return '#78716c'   // orography → brown
  if (g === '6') return '#10b981'   // coast / beaches → teal
  if (g === '2') return '#f59e0b'   // buildings / settlements → amber
  if (g === '3') return '#8b5cf6'   // transport → purple
  return '#6366f1'
}

// ── NGBE search-result preview markers ───────────────────────────────────────
function NgbeFitter({ items }) {
  const map = useMap()
  // Use a stable string key derived from item IDs instead of the array reference.
  // items is often a new array each render (from .filter()), which would cause an
  // infinite loop: fitBounds → map re-render → new array → fitBounds → …
  const itemsKey = items?.map(e => e.id).join(',') ?? ''
  useEffect(() => {
    if (!itemsKey) return
    const pts = (items || []).filter(e => e.lat && e.lng).map(e => [e.lat, e.lng])
    if (!pts.length) return
    try { map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 }) } catch {}
  }, [map, itemsKey]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function NgbePreviewLayer({ items, selectedIds, onItemClick, osmCache }) {
  if (!items?.length) return null
  return (
    <>
      <NgbeFitter items={items} />
      {items.map(e => {
        if (!e.lat || !e.lng) return null
        const selected = selectedIds?.has(e.id)
        const base = ngbeCatColor(e.cat)
        const geom = osmCache?.[e.id]

        // Use type-keyed keys so React fully remounts when geometry type changes
        const geomType = (geom && geom !== 'loading' && geom.type) || 'point'
        const itemKey = `${e.id}-${geomType}`

        // Selected item with real OSM geometry → render as line or polygon
        if (selected && geom && geom !== 'loading' && geom.coordinates?.length >= 2) {
          const handlers = { eventHandlers: { click: () => onItemClick(e.id) } }
          if (geom.type === 'line') return (
            <Polyline key={itemKey} positions={geom.coordinates}
              pathOptions={{ color: '#1e40af', weight: 3, fill: false }}
              {...handlers}>
              <Tooltip sticky>{e.name}</Tooltip>
            </Polyline>
          )
          if (geom.type === 'poly') return (
            <Polygon key={itemKey} positions={geom.coordinates}
              pathOptions={{ color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 0.25, weight: 3 }}
              {...handlers}>
              <Tooltip sticky>{e.name}</Tooltip>
            </Polygon>
          )
        }

        // Default: circle marker
        return (
          <CircleMarker
            key={itemKey}
            center={[e.lat, e.lng]}
            radius={selected ? 10 : 7}
            pathOptions={{
              color:       selected ? '#1e40af' : base,
              fillColor:   selected ? '#3b82f6' : base,
              fillOpacity: selected ? 1 : 0.7,
              weight:      selected ? 3 : 2,
            }}
            eventHandlers={{ click: () => onItemClick(e.id) }}
          >
            <Tooltip>{e.name} <span style={{opacity:0.6}}>({e.cat})</span></Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}

// ── Tracks map bounds and reports them upward ─────────────────────────────────
function BoundsTracker({ onBoundsChange }) {
  const map = useMap()
  const report = useCallback(() => onBoundsChange(map.getBounds()), [map, onBoundsChange])
  useMapEvents({ moveend: report, zoomend: report })
  useEffect(() => { report() }, [report])
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BackofficeMap({
  isDrawing, drawingType, currentPoints, onAddPoint,
  drafts, selectedDraftId, onDraftClick,
  repository, onBoundsChange, onTopoClick,
  ngbePreview, ngbeSelectedIds, onNgbeItemClick, ngbeOsmCache,
}) {
  return (
    <MapContainer
      center={CENTER_CANTABRIA}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
      doubleClickZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
      />
      <CantabriaColorPane />
      <DrawingEvents isDrawing={isDrawing} onAddPoint={onAddPoint} />
      {onBoundsChange && <BoundsTracker onBoundsChange={onBoundsChange} />}
      <ExistingLayer repository={repository} onTopoClick={onTopoClick} />
      {drafts.map(d => (
        <DraftShape key={d.draftId} draft={d}
          isSelected={d.draftId === selectedDraftId}
          onClick={onDraftClick} />
      ))}
      <DrawingPreview type={drawingType} points={currentPoints} />
      {ngbePreview && (
        <NgbePreviewLayer
          items={ngbePreview}
          selectedIds={ngbeSelectedIds}
          onItemClick={onNgbeItemClick}
          osmCache={ngbeOsmCache}
        />
      )}
    </MapContainer>
  )
}
