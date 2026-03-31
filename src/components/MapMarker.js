import L from 'leaflet'
import { Marker, Popup, Tooltip } from 'react-leaflet'

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

// House-shaped icon for human settlements
function makeSettlementIcon(colors, size = 'medium') {
  const scale = MARKER_RADII[size] || 5
  const s = scale * 2.2  // overall scale unit
  const w = s * 2, h = s * 2.2
  const pad = 2
  const tw = w + pad * 2, th = h + pad * 2
  const color = colors[0] || '#2563eb'
  // House: peaked roof triangle + square body
  const roofH = h * 0.45
  const bodyH = h * 0.58
  const bodyY = pad + roofH - 2
  const bx = pad, by = bodyY
  const bw = w, bh = bodyH
  // Roof points: apex, right, left
  const rx = pad + w / 2, ry = pad
  const rl = pad, rr = pad + w
  const rb = pad + roofH
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th}">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="1" fill="${color}" stroke="white" stroke-width="1.2"/>
      <polygon points="${rl},${rb} ${rr},${rb} ${rx},${ry}" fill="${color}" stroke="white" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>`,
    className: '',
    iconSize: [tw, th],
    iconAnchor: [tw / 2, th - pad],
    popupAnchor: [0, -(th - pad)],
  })
}

// Mountain/peak icon for orographic features
function makeMountainIcon(colors, size = 'medium') {
  const scale = MARKER_RADII[size] || 5
  const s = scale * 2.2
  const w = s * 2.4, h = s * 1.8
  const pad = 2
  const tw = w + pad * 2, th = h + pad * 2
  const color = colors[0] || '#2563eb'
  // Two overlapping triangles (mountain silhouette)
  const bx = pad, by = pad + h, bw = w
  // Main peak
  const p1 = `${pad},${pad + h} ${pad + w / 2},${pad} ${pad + w},${pad + h}`
  // Secondary peak (left)
  const p2 = `${pad},${pad + h} ${pad + w * 0.3},${pad + h * 0.4} ${pad + w * 0.6},${pad + h}`
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th}">
      <polygon points="${p2}" fill="${color}" opacity="0.7"/>
      <polygon points="${p1}" fill="${color}" stroke="white" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>`,
    className: '',
    iconSize: [tw, th],
    iconAnchor: [tw / 2, th - pad],
    popupAnchor: [0, -(th - pad)],
  })
}

function pickIcon(tags, colors, size) {
  if (tags && tags.includes('meta_category:settlement')) return makeSettlementIcon(colors, size)
  if (tags && tags.includes('meta_category:mountain')) return makeMountainIcon(colors, size)
  return makePieIcon(colors, size)
}

export default function MapMarker(props) {
  const colors = props.colors || [props.color || '#2563eb']
  return (
    <Marker position={props.position} icon={pickIcon(props.tags, colors, props.markerSize)}>
      <Popup>
        <button className="topo-popup-link" onClick={() => props.onMarkerClick(props.hash)}>
          {props.title}
        </button>
      </Popup>
      {props.showTitle && <Tooltip permanent direction="top" offset={[0, -(MARKER_RADII[props.markerSize || 'medium'] + 4)]} className="topo-label">{props.title}</Tooltip>}
    </Marker>
  )
}
