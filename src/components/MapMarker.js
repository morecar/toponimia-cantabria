import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import { Link } from "react-router-dom"
import { ROUTE_RESULT } from '../resources/routes'

function makeIcon(color) {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <circle cx="6" cy="6" r="5" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  })
}

export default function MapMarker(props) {
  return (
    <Marker position={props.position} icon={makeIcon(props.color || '#2563eb')}>
      <Popup>
        <Link to={`${ROUTE_RESULT}?h=${props.hash}`}>
          {props.title}
        </Link>
      </Popup>
    </Marker>
  )
}
