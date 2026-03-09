import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, useMapEvents, useMap, Tooltip } from 'react-leaflet'
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
function ExistingLayer({ repository }) {
  if (!repository) return null
  const all = repository.database?.value?.() || []
  return (
    <>
      {all.map(t => {
        const opts = { color: EXISTING_COLOR, fillColor: EXISTING_COLOR, fillOpacity: 0.4, weight: 1 }
        if (t.type === 'point' && t.coordinates?.[0])
          return <CircleMarker key={t.hash} center={t.coordinates[0]} radius={3} pathOptions={opts} />
        if (t.type === 'line' && t.coordinates?.length > 1)
          return <Polyline key={t.hash} positions={t.coordinates} pathOptions={{ ...opts, fillOpacity: 0 }} />
        if (t.type === 'poly' && t.coordinates?.length > 2)
          return <Polygon key={t.hash} positions={t.coordinates} pathOptions={{ ...opts, fillOpacity: 0.1 }} />
        return null
      })}
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BackofficeMap({
  isDrawing, drawingType, currentPoints, onAddPoint,
  drafts, selectedDraftId, onDraftClick,
  repository,
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
      <ExistingLayer repository={repository} />
      {drafts.map(d => (
        <DraftShape key={d.draftId} draft={d}
          isSelected={d.draftId === selectedDraftId}
          onClick={onDraftClick} />
      ))}
      <DrawingPreview type={drawingType} points={currentPoints} />
    </MapContainer>
  )
}
