import { Redirect, useLocation, useHistory } from "react-router-dom";
import { ROUTE_HOME } from "../../staticData/localization";

import ResultsPage from '../ResultsPage'

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ResultsRoute(props) {
    let query = useQuery();
    let search = { "wordId": query.get('h') ?? undefined, "queryString": query.get('q') ?? "" }
    let history = useHistory()

    if(!search.wordId && !search.queryString) return <Redirect to={ROUTE_HOME}/>
    else return <ResultsPage repository={props.repository} search="true" {...search} {...props} history={history}/>

}
