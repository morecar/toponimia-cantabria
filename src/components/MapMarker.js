import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import { Link } from "react-router-dom"
import { ROUTE_RESULT } from '../resources/routes'

const MARKER_RADII = { small: 3, medium: 5, large: 8 }

function makePieIcon(colors, size = 'medium') {
  const r = MARKER_RADII[size] || 5
  const d = r * 2 + 4
  const cx = r + 2, cy = r + 2
  const n = colors.length
  let segments

  if (n === 1) {
    segments = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[0]}"/>`
  } else {
    segments = colors.map((color, i) => {
      const a0 = (2 * Math.PI * i / n) - Math.PI / 2
      const a1 = (2 * Math.PI * (i + 1) / n) - Math.PI / 2
      const x1 = (cx + r * Math.cos(a0)).toFixed(3)
      const y1 = (cy + r * Math.sin(a0)).toFixed(3)
      const x2 = (cx + r * Math.cos(a1)).toFixed(3)
      const y2 = (cy + r * Math.sin(a1)).toFixed(3)
      const large = (a1 - a0) > Math.PI ? 1 : 0
      return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${color}"/>`
    }).join('')
  }

  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 ${d} ${d}">
      ${segments}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="white" stroke-width="1.5"/>
    </svg>`,
    className: '',
    iconSize: [d, d],
    iconAnchor: [cx, cy],
    popupAnchor: [0, -(cy + 2)],
  })
}

export default function MapMarker(props) {
  const colors = props.colors || [props.color || '#2563eb']
  return (
    <Marker position={props.position} icon={makePieIcon(colors, props.markerSize)}>
      <Popup>
        <Link to={`${ROUTE_RESULT}?h=${props.hash}`}>
          {props.title}
        </Link>
      </Popup>
    </Marker>
  )
}
