import { useHistory, useLocation } from "react-router-dom";

import CapturePage from '../CapturePage'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ResultsRoute(props) {
    let query = useQuery();
    let project = { "project": query.get('p') ?? undefined }

    return  <CapturePage repository={props.repository} project={project} {...props} history={useHistory()}/>

}
