import { Marker, Popup} from 'react-leaflet'

import TagsContainer from './TagsContainer'

export default function MapMarker(props) {
    return (
        <Marker position={props.position}>
            <Popup>{props.title}</Popup>
            {props.displayTags?<TagsContainer tags={props.tags}/>:null}
        </Marker>
    );
  }