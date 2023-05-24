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
        const { origin, search, pathname } = new URL(redirectUrl)
        console.log(`${origin}${pathname}?${stringify(qs)}${search.replace('?', '&')}`)
        navigate(`${origin}${pathname}?${stringify(qs)}${search.replace('?', '&')}`, { replace: true })
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
