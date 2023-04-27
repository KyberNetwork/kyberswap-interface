import { Navigate } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

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
  const { loading, isWhiteList } = useIsWhiteListKyberAI()
  if (loading) return <LocalLoader />
  return !isWhiteList ? <Navigate to={redirectUrl} replace /> : children
}

export default ProtectedRoute
