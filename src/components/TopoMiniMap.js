import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'

function makeIcon() {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="5" fill="#2563eb"/>
      <circle cx="7" cy="7" r="5" fill="none" stroke="white" stroke-width="1.5"/>
    </svg>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function FitToTopo({ coordinates, type }) {
  const map = useMap()
  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return
    if (type === 'point') {
      map.setView(coordinates[0], 14)
    } else {
      map.fitBounds(coordinates, { padding: [24, 24] })
    }
  }, [map, coordinates, type])
  return null
}

const POINT_COLOR = '#2563eb'
const LINE_COLOR  = '#16a34a'
const POLY_COLOR  = '#7c3aed'

function pathColor(type) {
  if (type === 'line') return LINE_COLOR
  if (type === 'poly') return POLY_COLOR
  return POINT_COLOR
}

export default function TopoMiniMap({ topo }) {
  const { coordinates, type } = topo
  const center = coordinates[0] || [43.2, -3.9]
  const color = pathColor(type)

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={true}
      style={{ height: '220px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitToTopo coordinates={coordinates} type={type} />
      {type === 'point' && (
        <Marker position={coordinates[0]} icon={makeIcon()} />
      )}
      {type === 'line' && (
        <Polyline pathOptions={{ color, weight: 3 }} positions={coordinates} />
      )}
      {type === 'poly' && (
        <Polygon pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2 }} positions={coordinates} />
      )}
    </MapContainer>
  )
}
