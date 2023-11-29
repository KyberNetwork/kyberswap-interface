import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { usePrevious } from 'react-use'

import LocalLoader from 'components/LocalLoader'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useInvalidateTagKyberAi, useInvalidateTagPortfolio } from 'hooks/useInvalidateTags'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

type Props = {
  children: JSX.Element
  redirectUrl?: string
}

// todo generic it
const useSubscribeChangeUserInfo = () => {
  const { userInfo } = useSessionInfo()
  const invalidateTags = useInvalidateTagPortfolio()
  const prevIdentityId = usePrevious(userInfo?.identityId)

  useEffect(() => {
    if (prevIdentityId && prevIdentityId !== userInfo?.identityId) {
      try {
        invalidateTags([
          RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO,
          RTK_QUERY_TAGS.GET_FAVORITE_PORTFOLIO,
          RTK_QUERY_TAGS.GET_SETTING_PORTFOLIO,
          RTK_QUERY_TAGS.GET_LIST_PORTFOLIO,
        ])
      } catch (error) {}
    }
  }, [userInfo?.identityId, invalidateTags, prevIdentityId])
}

// wait until sign in eth/anonymous done (error/success)
const ProtectedRoute = ({ children }: Props) => {
  const { pendingAuthentication } = useSessionInfo()
  const loaded = useRef(false)
  useSubscribeChangeUserInfo()

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
  const invalidateTags = useInvalidateTagKyberAi()

  useEffect(() => {
    // change account sign in => refresh participant info
    try {
      refetch()
      invalidateTags([RTK_QUERY_TAGS.GET_WATCHLIST_TOKENS_KYBER_AI, RTK_QUERY_TAGS.GET_WATCHLIST_INFO_KYBER_AI])
    } catch (error) {}
  }, [userInfo?.identityId, refetch, invalidateTags])

  if (loading && !loadedPage.current) return <LocalLoader />
  if (!canAccessPage) return <Navigate to={redirectUrl} replace />
  loadedPage.current = true
  return children
}

export default ProtectedRoute
