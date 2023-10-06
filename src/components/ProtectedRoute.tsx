import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
import { RTK_QUERY_TAGS } from 'constants/index'
import kyberAIapi from 'pages/TrueSightV2/hooks/useKyberAIData'
import { useSessionInfo } from 'state/authen/hooks'
import { useAppDispatch } from 'state/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

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

export const ProtectedRouteKyberAI = ({
  children,
  redirectUrl = '/',
  waitUtilAuthenEndOnly,
}: Props & {
  waitUtilAuthenEndOnly?: boolean
}) => {
  const { loading, isWhiteList, refetch } = useIsWhiteListKyberAI()
  const { userInfo } = useSessionInfo()
  const loadedPage = useRef(false)
  const canAccessPage = isWhiteList || waitUtilAuthenEndOnly
  const dispatch = useAppDispatch()

  useEffect(() => {
    // change account sign in => refresh participant info
    try {
      refetch()
      dispatch(
        kyberAIapi.util.invalidateTags([
          RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI,
          RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI,
        ]),
      )
    } catch (error) {}
  }, [userInfo?.identityId, refetch, dispatch])

  if (loading && !loadedPage.current) return <LocalLoader />
  if (!canAccessPage) return <Navigate to={redirectUrl} replace />
  loadedPage.current = true
  return children
}

export default ProtectedRoute
