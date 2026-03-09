import { useNavigate } from 'react-router-dom'
import EtymologiesPage from '../EtymologiesPage'

export default function EtymologiesRoute(props) {
  const navigate = useNavigate()
  return (
    <EtymologiesPage
      etymologyStore={props.etymologyStore}
      repository={props.repository}
      loc={props.loc}
      onBack={() => navigate(-1)}
    />
  )
}
