import { parse, stringify } from 'querystring'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import Loader from 'components/LocalLoader'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSessionInfo } from 'state/authen/hooks'
import { useLoginRedirectUrl } from 'state/profile/hooks'

const VerifyAuth = () => {
  const navigate = useNavigate()
  const qs = useParsedQueryString()
  const { pendingAuthentication } = useSessionInfo()
  const [redirectUrl, setLoginRedirectUrl] = useLoginRedirectUrl()

  useEffect(() => {
    try {
      if (redirectUrl && !pendingAuthentication) {
        setLoginRedirectUrl('')
        const { search, pathname } = new URL(redirectUrl)
        const { code, scope, state, ...rest } = qs
        const query = { ...parse(search.replace('?', '')), ...rest }
        navigate(`${pathname}?${stringify(query)}`, { replace: true })
      }
    } catch (error) {}
  }, [navigate, qs, pendingAuthentication, setLoginRedirectUrl, redirectUrl])

  return (
    <Flex justifyContent={'center'}>
      <Loader />
    </Flex>
  )
}

export default VerifyAuth
