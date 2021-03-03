import {Tooltip} from 'react-leaflet'
import Badge from 'react-bootstrap/Badge'

export default function TagsContainer(props) {
    return (
        <Tooltip permanent={true} direction={'bottom'} offset={[-15, 20]} className={"tagsContainer"}>
            {
                Object.keys(props.tags).map(function(key) {
                    return  <span key={key}><Badge variant={"primary"}>{props.loc.get(`tag_${props.tags[key]}`)}</Badge>{' '}</span>
                })
            }
        </Tooltip>
    );
  }