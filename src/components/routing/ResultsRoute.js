import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_HOME } from "../../resources/routes";

import ResultsPage from '../ResultsPage'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ResultsRoute(props) {
    let query = useQuery();
    let queryStrings = query.getAll('q').filter(Boolean)
    let navigate = useNavigate()

    if(queryStrings.length === 0) return <Navigate to={ROUTE_HOME} replace />
    return <ResultsPage repository={props.repository} search="true" queryStrings={queryStrings} {...props} history={navigate}/>
}
