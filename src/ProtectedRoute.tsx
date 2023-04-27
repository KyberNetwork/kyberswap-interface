import { Navigate } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
import { useGetParticipantInfoQuery } from 'pages/TrueSightV2/hooks/useKyberAIDataV2'
import { ParticipantStatus } from 'pages/TrueSightV2/types'
import { useSessionInfo } from 'state/authen/hooks'

type Props = {
  children: JSX.Element
  redirectUrl?: string
}
const ProtectedRoute = ({ children, redirectUrl = '/' }: Props): JSX.Element => {
  const [{ isLogin, processing }] = useSessionInfo()
  if (processing) return <LocalLoader />
  return !isLogin ? <Navigate to={redirectUrl} replace /> : children
}

export const ProtectedRouteKyberAI = ({ children, redirectUrl = '/' }: Props) => {
  const [{ isLogin, processing, profile }] = useSessionInfo()
  const { data: participantInfo, isFetching } = useGetParticipantInfoQuery(undefined, { skip: !profile })
  if (processing || isFetching) return <LocalLoader />
  // must be login and whitelisted
  return !isLogin || participantInfo?.status !== ParticipantStatus.WHITELISTED ? (
    <Navigate to={redirectUrl} replace />
  ) : (
    children
  )
}

export default ProtectedRoute
