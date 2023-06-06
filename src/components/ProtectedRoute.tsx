import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import kyberAIApi from 'services/kyberAISubscription'

import { useInvalidateTags } from 'components/Announcement/helper'
import LocalLoader from 'components/LocalLoader'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

type Props = {
  children: JSX.Element
  redirectUrl?: string
}

// wait utils sign in eth/anonymous done (error/success)
const ProtectedRoute = ({ children }: Props) => {
  const { pendingAuthentication } = useSessionInfo()
  return pendingAuthentication ? <LocalLoader /> : children
}

export const ProtectedRouteKyberAI = ({
  children,
  redirectUrl = '/',
  waitUtilAuthenEndOnly,
}: Props & {
  waitUtilAuthenEndOnly?: boolean
}) => {
  const { loading, isWhiteList } = useIsWhiteListKyberAI()
  const { userInfo } = useSessionInfo()
  const invalidate = useInvalidateTags(kyberAIApi.reducerPath)
  const loadedPage = useRef(false)
  const canAccessPage = isWhiteList || waitUtilAuthenEndOnly

  useEffect(() => {
    // change account sign in => refresh participant info
    invalidate(RTK_QUERY_TAGS.GET_PARTICIPANT_INFO_KYBER_AI)
  }, [userInfo?.identityId, invalidate])

  if (loading && !loadedPage.current) return <LocalLoader />
  if (!canAccessPage) return <Navigate to={redirectUrl} replace />
  loadedPage.current = true
  return children
}

export default ProtectedRoute
