import { MapContainer, TileLayer, Polyline, Polygon} from 'react-leaflet'

import MapMarker from './MapMarker';

import {CENTER_CANTABRIA} from '../resources/constants'

function getCentroid(arr) { 
    return arr.reduce(function (x,y) {
        return [x[0] + y[0]/arr.length, x[1] + y[1]/arr.length] 
    }, [0,0]) 
}

export default function ResultsMap(props) {
    const blackOptions = { color: 'black' }
    return (
        <MapContainer center={CENTER_CANTABRIA} zoom={10} scrollWheelZoom={true} zoomControl={false} dragging={true}>   
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {
            Object.keys(props.points).map(function(key) {
              return <MapMarker displayTags={props.displayTags} key={props.points[key].hash} position={props.points[key].coordinates[0]} {...props.points[key]} loc={props.loc}/>
            })
          }
          {
            Object.keys(props.polys).map(function(key) {
              return <div key={key}>
                      <Polygon pathOptions={blackOptions} positions={props.polys[key].coordinates} />
                      <MapMarker displayTags={props.displayTags} key={props.polys[key].hash} position={getCentroid(props.polys[key].coordinates)} {...props.polys[key]} loc={props.loc}/>
                    </div>
            })
          }
          {
            Object.keys(props.lines).map(function(key) {
              return <div key={key}>
                      <Polyline pathOptions={blackOptions} positions={props.lines[key].coordinates} />
                      <MapMarker displayTags={props.displayTags} key={props.lines[key].hash} position={getCentroid(props.lines[key].coordinates)} {...props.lines[key]} loc={props.loc}/>
                    </div>
            })
          }
        </MapContainer>
    );
}