import { useNavigate } from "react-router-dom";

import ResultsPage from '../ResultsPage'

export default function HomeRoute(props) {
    const navigate = useNavigate()
    return <ResultsPage repository={props.repository} {...props} search="false" history={navigate}/>
}
