import {Tooltip} from 'react-leaflet'
import Badge from 'react-bootstrap/Badge'

export default function TagsContainer(props) {
    return (
        <Tooltip permanent={true} direction={'bottom'} offset={[-15, 20]} className={"tagsContainer"}>
            {
                Object.keys(props.tags).map(function(key) {
                    return  <span key={key}><Badge variant={"primary"}>{getLabel(props.tags[key])}</Badge>{' '}</span>
                })
            }
        </Tooltip>
    );
  }

function getLabel(tag) {
    if(tag.startsWith("etymology")) {
        if(tag.endsWith("celtic")) return "Et: Celta"
        if(tag.endsWith("romance")) return "Et: Romanci"
    }
    if(tag.startsWith("phonology")) {
        if(tag.endsWith("metaphony_u")) return "Metafunía U"
        if(tag.endsWith("aspirate_f")) return "F aspiráu"
        if(tag.endsWith("b_g")) return "Cambiu B > G"
        if(tag.endsWith("lost_f")) return "F mudu"
    }

    return tag.split(':').pop()
} 