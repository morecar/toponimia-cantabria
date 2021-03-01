import { Marker, Popup} from 'react-leaflet'

import { Link, generatePath } from "react-router-dom"

import { ROUTE_RESULT_PATTERN } from '../staticData/localization'

import TagsContainer from './TagsContainer'

export default function MapMarker(props) {
    return (
        <Marker position={props.position}>
            <Popup><Link to={generatePath(ROUTE_RESULT_PATTERN, {hash: props.hash})}>{props.title}</Link></Popup>
            {props.displayTags?<TagsContainer tags={props.tags}/>:null}
        </Marker>
    );
  }