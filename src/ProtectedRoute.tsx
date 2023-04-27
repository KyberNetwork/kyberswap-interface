import { Navigate } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

type Props = {
  children: JSX.Element
  redirectUrl?: string
}

const ProtectedRoute = ({ children, redirectUrl = '/' }: Props): JSX.Element => {
  const { isLogin, pendingAuthentication } = useSessionInfo()
  if (pendingAuthentication) return <LocalLoader />
  return isLogin ? children : <Navigate to={redirectUrl} replace />
}

export const ProtectedRouteKyberAI = ({
  children,
  redirectUrl = '/',
  waitUtilAuthenEndOnly,
}: Props & {
  waitUtilAuthenEndOnly?: boolean
}) => {
  const { loading, isWhiteList } = useIsWhiteListKyberAI()
  if (loading) return <LocalLoader />
  return isWhiteList || waitUtilAuthenEndOnly ? children : <Navigate to={redirectUrl} replace />
}

export default ProtectedRoute
