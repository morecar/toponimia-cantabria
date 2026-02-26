import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_HOME } from "../../resources/routes";

import ResultsPage from '../ResultsPage'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ResultsRoute(props) {
    let query = useQuery();
    let search = { "wordId": query.get('h') ?? undefined, "queryString": query.get('q') ?? "" }
    let navigate = useNavigate()

    if(!search.wordId && !search.queryString) return <Navigate to={ROUTE_HOME} replace />
    else return <ResultsPage repository={props.repository} search="true" {...search} {...props} history={navigate}/>

}
