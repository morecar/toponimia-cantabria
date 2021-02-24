import React, { Component} from 'react';

import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet'

import {CENTER_CANTABRIA} from '../staticData/constants'


function LocationMarker(props) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      props.onClick([lat, lng])
    }
  })
}

export default class CaptureMap extends Component {
  constructor(props) {
    super(props);
    this.searchBoxRef = React.createRef()

    this.state = {
      newPoints : []
    }
  }


  registerLocation(position) {
    this.setState({ newPoints: [...this.state.newPoints, position]})
  }


  render() {
    const blackOptions = { color: 'black' }
    const limeOptions = { color: 'black', dashArray: "4" }
    const newPointsLength = this.state.newPoints.length-1
    return (
      <Container>
        <MapContainer center={CENTER_CANTABRIA} zoom={10} scrollWheelZoom={true} zoomControl={false} dragging={true}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

{
            Object.keys(this.state.newPoints).map(function(key) {
              return <Marker position={this.state.newPoints[key]} key={key}>
              </Marker>
            }.bind(this))
           }

        <Polyline pathOptions={blackOptions} positions={this.state.newPoints} />

          {
            this.state.newPoints.length > 2 
            ? <Polyline pathOptions={limeOptions} positions={[this.state.newPoints[0], this.state.newPoints[newPointsLength]]} />
            : null
          }
          <LocationMarker onClick={this.registerLocation.bind(this)}/>
        </MapContainer>
        <Navbar fixed="bottom"  bg="dark" expand="lg" variant="dark">
          <Navbar.Brand>
            <img src="./unicorn.png" alt="Icunu di unicurniu encabritáu"/>
          </Navbar.Brand>          
        </Navbar>
      </Container>
    );
  }
}