import { useHistory } from "react-router-dom";

import ResultsPage from '../ResultsPage'

export default function HomeRoute(props) {
    const history = useHistory()
    return <ResultsPage repository={props.repository} {...props} search="false" history={history}/>
}
