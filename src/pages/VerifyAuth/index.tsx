import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import Loader from 'components/LocalLoader'
import { getLoginRedirectUrl, removeLoginRedirectUrl } from 'utils/redirectUponLogin'

const VerifyAuth = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const redirectUrl = getLoginRedirectUrl()
    if (redirectUrl) {
      removeLoginRedirectUrl()
      navigate(redirectUrl)
    }
  }, [navigate])

  return (
    <Flex justifyContent={'center'}>
      <Loader />
    </Flex>
  )
}

export default VerifyAuth
