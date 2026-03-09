import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Polygon, Popup, Tooltip, useMap } from 'react-leaflet'
import MapMarker from './MapMarker'
import CantabriaColorPane from './CantabriaColorPane'
import { CENTER_CANTABRIA } from '../resources/constants'

function TopoPopup({ hash, title, onMarkerClick }) {
  return (
    <Popup>
      <button className="topo-popup-link" onClick={() => onMarkerClick(hash)}>{title}</button>
    </Popup>
  )
}

function FlyTo({ hash, points }) {
  const map = useMap()
  useEffect(() => {
    if (!hash) return
    const point = points.find(p => p.hash === hash)
    if (point?.coordinates?.[0]) {
      map.flyTo(point.coordinates[0], Math.max(map.getZoom(), 14), { duration: 0.8 })
    }
  }, [hash]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function ZoomWatcher({ initialZoom, onZoomed }) {
  const map = useMap()
  useEffect(() => {
    function handleZoom() {
      if (map.getZoom() > initialZoom) onZoomed()
    }
    map.on('zoomend', handleZoom)
    return () => { map.off('zoomend', handleZoom) }
  }, [map, initialZoom, onZoomed])
  return null
}

function FitBounds({ points, lines, polys, searching }) {
  const map = useMap()
  useEffect(() => {
    if (!searching) return
    const allCoords = [
      ...Object.values(points).flatMap(p => p.coordinates),
      ...Object.values(lines).flatMap(l => l.coordinates),
      ...Object.values(polys).flatMap(p => p.coordinates),
    ]
    if (allCoords.length > 0) {
      map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 15 })
    }
  }, [points, lines, polys, searching, map])
  return null
}

const lineOptions = { color: '#2563eb', weight: 2, fill: false }
const polyOptions = { color: '#2563eb', weight: 2, fillColor: '#2563eb', fillOpacity: 0.15 }


export default function ResultsMap(props) {
  return (
    <MapContainer center={CENTER_CANTABRIA} zoom={10} scrollWheelZoom={true} zoomControl={false} dragging={true}>
      <FitBounds points={props.points} lines={props.lines} polys={props.polys} searching={props.searching} />
      {props.flyToHash && <FlyTo hash={props.flyToHash} points={props.points} />}
      {props.onZoomed && <ZoomWatcher initialZoom={10} onZoomed={props.onZoomed} />}
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CantabriaColorPane />
      {props.points.map(p =>
        <MapMarker key={p.hash} position={p.coordinates[0]} hash={p.hash} title={p.title} colors={p.colors} markerSize={props.markerSize} showTitle={props.displayTitle} onMarkerClick={props.onMarkerClick} />
      )}
      {props.lines.map(l =>
        <Polyline key={l.hash} pathOptions={{ ...lineOptions, color: l.color }} positions={l.coordinates}>
          <TopoPopup hash={l.hash} title={l.title} onMarkerClick={props.onMarkerClick} />
          {props.displayTitle && <Tooltip permanent className="topo-label">{l.title}</Tooltip>}
        </Polyline>
      )}
      {props.polys.map(p =>
        <Polygon key={p.hash} pathOptions={{ ...polyOptions, color: p.color, fillColor: p.color }} positions={p.coordinates}>
          <TopoPopup hash={p.hash} title={p.title} onMarkerClick={props.onMarkerClick} />
          {props.displayTitle && <Tooltip permanent className="topo-label">{p.title}</Tooltip>}
        </Polygon>
      )}
    </MapContainer>
  )
}
