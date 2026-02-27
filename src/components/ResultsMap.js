import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Polygon, Popup, useMap } from 'react-leaflet'
import { Link } from "react-router-dom"
import MapMarker from './MapMarker'
import { CENTER_CANTABRIA } from '../resources/constants'
import { ROUTE_RESULT } from '../resources/routes'

function TopoPopup({ hash, title }) {
  return (
    <Popup>
      <Link to={`${ROUTE_RESULT}?h=${hash}`}>{title}</Link>
    </Popup>
  )
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

// ── Frontera de Cantabria ─────────────────────────────────────────────────────
// Se obtiene de Nominatim/OSM en tiempo de ejecución y se cachea 90 días.
// Los arrays siguientes son el fallback si la red no está disponible.
// Formato: [lng, lat] (GeoJSON), igual que devuelve Nominatim.

const FALLBACK_RINGS = [
  [ // Cantabria (cuerpo principal)
    [-3.590244, 43.513559], [-3.546344, 43.507707], [-3.497832, 43.472243],
    [-3.430884, 43.461995], [-3.429784, 43.44101 ], [-3.464968, 43.444601],
    [-3.491682, 43.424797], [-3.463569, 43.43128 ], [-3.46472,  43.403938],
    [-3.450051, 43.436061], [-3.425241, 43.413248], [-3.32379,  43.419161],
    [-3.320764, 43.40279 ], [-3.221292, 43.393903], [-3.225887, 43.387609],
    [-3.211891, 43.37484 ], [-3.153287, 43.353315], [-3.151522, 43.306852],
    [-3.209506, 43.283538], [-3.225228, 43.308937], [-3.279447, 43.290052],
    [-3.332405, 43.301878], [-3.340126, 43.27803 ], [-3.449059, 43.23591 ],
    [-3.417646, 43.133427], [-3.603544, 43.149637], [-3.612449, 43.169518],
    [-3.651017, 43.18104 ], [-3.704677, 43.116275], [-3.754882, 43.100548],
    [-3.764569, 43.081034], [-3.846961, 43.084399], [-3.831769, 43.063826],
    [-3.849866, 43.040218], [-3.890746, 43.041826], [-3.909261, 43.016097],
    [-3.952997, 43.000101], [-3.990978, 42.931088], [-3.973716, 42.91192 ],
    [-3.929642, 42.914699], [-3.933543, 42.899602], [-3.867095, 42.954829],
    [-3.830572, 42.929201], [-3.866807, 42.899234], [-3.907819, 42.914523],
    [-3.892934, 42.887363], [-3.924349, 42.889221], [-3.897473, 42.880285],
    [-3.914832, 42.860084], [-3.879821, 42.851326], [-3.863736, 42.88981 ],
    [-3.834788, 42.877363], [-3.816032, 42.810561], [-3.862043, 42.786522],
    [-3.894446, 42.804538], [-3.910953, 42.768386], [-3.977295, 42.75805 ],
    [-3.999652, 42.768979], [-4.003555, 42.831407], [-4.054688, 42.763027],
    [-4.08134,  42.761464], [-4.10517,  42.793027], [-4.149915, 42.789309],
    [-4.185429, 42.817297], [-4.178566, 42.826247], [-4.165451, 42.82821 ],
    [-4.158091, 42.837659], [-4.140447, 42.829002], [-4.12612,  42.856637],
    [-4.149901, 42.871134], [-4.214234, 42.847173], [-4.240249, 42.956533],
    [-4.348485, 42.972581], [-4.398114, 43.034868], [-4.447551, 43.05854 ],
    [-4.462752, 43.060535], [-4.475713, 43.038702], [-4.520932, 43.047368],
    [-4.558449, 43.019515], [-4.606084, 43.035767], [-4.638131, 43.016673],
    [-4.722822, 43.017239], [-4.743257, 43.028159], [-4.743985, 43.05645 ],
    [-4.766114, 43.055633], [-4.766497, 43.074547], [-4.816903, 43.092658],
    [-4.851426, 43.125945], [-4.834567, 43.157463], [-4.848068, 43.178136],
    [-4.734156, 43.189879], [-4.719602, 43.236454], [-4.730945, 43.257336],
    [-4.631883, 43.267653], [-4.606552, 43.300554], [-4.555242, 43.288098],
    [-4.547773, 43.268687], [-4.523513, 43.27817 ], [-4.522349, 43.335778],
    [-4.538809, 43.355926], [-4.511499, 43.393659], [-4.389356, 43.389921],
    [-4.340665, 43.405872], [-4.32802,  43.391252], [-4.280254, 43.387997],
    [-4.175226, 43.401054], [-4.081232, 43.438322], [-3.978686, 43.440875],
    [-3.957098, 43.455817], [-3.945545, 43.471148], [-3.894935, 43.470826],
    [-3.785204, 43.491766], [-3.763286, 43.467196], [-3.814332, 43.449475],
    [-3.825338, 43.451674], [-3.815154, 43.437006], [-3.830686, 43.435157],
    [-3.803722, 43.426615], [-3.822708, 43.413576], [-3.816016, 43.40181 ],
    [-3.779137, 43.420967], [-3.791279, 43.432212], [-3.776114, 43.449406],
    [-3.76526,  43.446282], [-3.746131, 43.451532], [-3.777179, 43.458215],
    [-3.734618, 43.459278], [-3.590244, 43.513559],
  ],
  [ // Valle de Villaverde (exclave)
    [-3.3057, 43.2534], [-3.2999, 43.2489], [-3.2968, 43.2448], [-3.2932, 43.2427],
    [-3.2929, 43.2386], [-3.2950, 43.2342], [-3.2955, 43.2321], [-3.2963, 43.2277],
    [-3.2968, 43.2240], [-3.2961, 43.2210], [-3.2934, 43.2172], [-3.2937, 43.2152],
    [-3.2962, 43.2094], [-3.2957, 43.2060], [-3.2919, 43.2032], [-3.2888, 43.2022],
    [-3.2865, 43.1979], [-3.2848, 43.1972],
    [-3.2832, 43.1991], [-3.2808, 43.2006], [-3.2768, 43.2009], [-3.2749, 43.2012],
    [-3.2726, 43.2019], [-3.2678, 43.2040], [-3.2660, 43.2063], [-3.2668, 43.2090],
    [-3.2703, 43.2130], [-3.2716, 43.2173], [-3.2677, 43.2222], [-3.2677, 43.2258],
    [-3.2703, 43.2290], [-3.2690, 43.2341], [-3.2603, 43.2381], [-3.2551, 43.2433],
    [-3.2515, 43.2485], [-3.2504, 43.2569], [-3.2492, 43.2596],
    [-3.2531, 43.2621], [-3.2606, 43.2643], [-3.2640, 43.2671], [-3.2674, 43.2674],
    [-3.2701, 43.2666], [-3.2738, 43.2651], [-3.2762, 43.2640], [-3.2789, 43.2619],
    [-3.2820, 43.2617], [-3.2873, 43.2617], [-3.2900, 43.2616], [-3.2945, 43.2605],
    [-3.3002, 43.2592], [-3.3045, 43.2583], [-3.3033, 43.2569], [-3.3041, 43.2546],
    [-3.3051, 43.2541], [-3.3057, 43.2534],
  ],
]

// ── Cache Nominatim ───────────────────────────────────────────────────────────
const CACHE_KEY = 'cantabria_boundary_v1'
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000  // 90 días

function loadCachedRings() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, rings } = JSON.parse(raw)
    if (Date.now() - ts < CACHE_TTL_MS) return rings
  } catch {}
  return null
}

function cacheRings(rings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rings }))
  } catch {}
}

// Extrae los anillos exteriores de un GeoJSON Polygon o MultiPolygon
// Resultado en formato [lng, lat] (GeoJSON estándar)
function geoJsonToRings(geojson) {
  if (geojson.type === 'Polygon') return [geojson.coordinates[0]]
  if (geojson.type === 'MultiPolygon') return geojson.coordinates.map(poly => poly[0])
  return []
}

// ── Componente de clip de color ───────────────────────────────────────────────
function CantabriaColorPane() {
  const map = useMap()
  const [rings, setRings] = useState(() => loadCachedRings())
  const [paneReady, setPaneReady] = useState(false)

  // Fetch desde Nominatim si no hay cache válida
  useEffect(() => {
    if (rings) return
    fetch(
      'https://nominatim.openstreetmap.org/search' +
      '?q=Cantabria&countrycodes=es&format=json&polygon_geojson=1&featuretype=state&limit=1'
    )
      .then(r => r.json())
      .then(data => {
        const fetched = data[0]?.geojson ? geoJsonToRings(data[0].geojson) : null
        const result = fetched?.length ? fetched : FALLBACK_RINGS
        cacheRings(result)
        setRings(result)
      })
      .catch(() => setRings(FALLBACK_RINGS))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Crear pane y registrar clip-path cuando los rings estén disponibles
  useEffect(() => {
    if (!rings) return

    if (!map.getPane('colorPane')) {
      const pane = map.createPane('colorPane')
      pane.style.zIndex = 201
    }

    function updateClip() {
      const pane = map.getPane('colorPane')
      if (!pane) return
      // latLngToLayerPoint da coordenadas en el espacio local del pane (dentro de
      // _mapPane), que es exactamente el sistema de coordenadas que usa clip-path.
      // El clip se mueve con el pane durante el paneo sin necesidad de recalcular.
      // Sólo hay que recalcular en zoom/viewreset/moveend, que es cuando Leaflet
      // actualiza pixelOrigin (también tras invalidateSize en resize).
      const pathData = rings.map(ring =>
        ring.map(([lng, lat], i) => {
          const p = map.latLngToLayerPoint([lat, lng])
          return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
        }).join('') + 'Z'
      ).join(' ')
      pane.style.clipPath = `path('${pathData}')`
    }

    updateClip()
    map.on('zoom viewreset moveend', updateClip)
    setPaneReady(true)
    return () => { map.off('zoom viewreset moveend', updateClip) }
  }, [map, rings])

  if (!paneReady) return null
  return (
    <TileLayer pane="colorPane" attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  )
}

export default function ResultsMap(props) {
  return (
    <MapContainer center={CENTER_CANTABRIA} zoom={10} scrollWheelZoom={true} zoomControl={false} dragging={true}>
      <FitBounds points={props.points} lines={props.lines} polys={props.polys} searching={props.searching} />
      {props.onZoomed && <ZoomWatcher initialZoom={10} onZoomed={props.onZoomed} />}
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CantabriaColorPane />
      {props.points.map(p =>
        <MapMarker key={p.hash} position={p.coordinates[0]} hash={p.hash} title={p.title} color={p.color} />
      )}
      {props.lines.map(l =>
        <Polyline key={l.hash} pathOptions={{ ...lineOptions, color: l.color }} positions={l.coordinates}>
          <TopoPopup hash={l.hash} title={l.title} />
        </Polyline>
      )}
      {props.polys.map(p =>
        <Polygon key={p.hash} pathOptions={{ ...polyOptions, color: p.color, fillColor: p.color }} positions={p.coordinates}>
          <TopoPopup hash={p.hash} title={p.title} />
        </Polygon>
      )}
    </MapContainer>
  )
}
