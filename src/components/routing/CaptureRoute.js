import { useNavigate, useLocation } from "react-router-dom";

import CapturePage from '../CapturePage'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function CaptureRoute(props) {
    let query = useQuery();
    let project = { "project": query.get('p') ?? undefined }
    let navigate = useNavigate()

    return  <CapturePage repository={props.repository} project={project} {...props} history={navigate}/>

}
