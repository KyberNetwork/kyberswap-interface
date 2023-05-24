import { stringify } from 'querystring'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import Loader from 'components/LocalLoader'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { getLoginRedirectUrl, removeLoginRedirectUrl } from 'utils/redirectUponLogin'

const VerifyAuth = () => {
  const navigate = useNavigate()
  const qs = useParsedQueryString()

  useEffect(() => {
    try {
      const redirectUrl = getLoginRedirectUrl()
      if (redirectUrl) {
        removeLoginRedirectUrl()
        const { search, pathname } = new URL(redirectUrl)
        navigate(`${pathname}?${stringify(qs)}${search.replace('?', '&')}`, { replace: true })
      }
    } catch (error) {}
  }, [navigate, qs])

  return (
    <Flex justifyContent={'center'}>
      <Loader />
    </Flex>
  )
}

export default VerifyAuth
