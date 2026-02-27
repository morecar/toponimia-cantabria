import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_HOME } from "../../resources/routes";

import ResultsPage from '../ResultsPage'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ResultsRoute(props) {
    let query = useQuery();
    let wordId = query.get('h') ?? undefined
    let queryStrings = query.getAll('q').filter(Boolean)
    let navigate = useNavigate()

    if(!wordId && queryStrings.length === 0) return <Navigate to={ROUTE_HOME} replace />
    return <ResultsPage repository={props.repository} search="true" wordId={wordId} queryStrings={queryStrings} {...props} history={navigate}/>
}
