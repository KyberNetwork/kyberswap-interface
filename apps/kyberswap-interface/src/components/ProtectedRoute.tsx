import { useRef } from 'react'

import LocalLoader from 'components/LocalLoader'
import { useSessionInfo } from 'state/authen/hooks'

type Props = {
  children: JSX.Element
  redirectUrl?: string
}

// wait utils sign in eth/anonymous done (error/success)
const ProtectedRoute = ({ children }: Props) => {
  const { pendingAuthentication } = useSessionInfo()
  const loaded = useRef(false)
  if (pendingAuthentication && !loaded.current) return <LocalLoader />
  loaded.current = true
  return children
}

export default ProtectedRoute
