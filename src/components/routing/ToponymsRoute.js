import { useNavigate } from 'react-router-dom'
import ToponymsPage from '../ToponymsPage'

export default function ToponymsRoute(props) {
  const navigate = useNavigate()
  return (
    <ToponymsPage
      repository={props.repository}
      loc={props.loc}
      onBack={() => navigate(-1)}
    />
  )
}
