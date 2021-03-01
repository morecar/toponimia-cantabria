import { Marker, Popup} from 'react-leaflet'

import { generatePath } from "react-router"

import { ROUTE_RESULT_PATTERN } from '../staticData/localization'

import TagsContainer from './TagsContainer'

export default function MapMarker(props) {
    return (
        <Marker position={props.position}>
            <Popup><a href={generatePath(ROUTE_RESULT_PATTERN, {hash: props.hash})}>{props.title}</a></Popup>
            {props.displayTags?<TagsContainer tags={props.tags}/>:null}
        </Marker>
    );
  }