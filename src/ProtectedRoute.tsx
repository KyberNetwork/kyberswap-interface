import { Navigate } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
import { useSessionInfo } from 'state/authen/hooks'

const ProtectedRoute = ({
  children,
  redirectUrl = '/',
}: {
  children: JSX.Element
  redirectUrl?: string
}): JSX.Element => {
  const [{ isLogin, processing }] = useSessionInfo()
  if (processing) return <LocalLoader />
  return !isLogin ? <Navigate to={redirectUrl} replace /> : children
}
export default ProtectedRoute
