import KyberOauth2 from '@kybernetwork/oauth2'
import { useEffect } from 'react'

import { ENV_KEY } from 'constants/env'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { PageContainer } from 'pages/Oauth/styled'

function Logout() {
  const { logout_challenge } = useParsedQueryString<{ logout_challenge: string }>()

  useEffect(() => {
    if (!logout_challenge) return
    KyberOauth2.initialize({ mode: ENV_KEY })
    KyberOauth2.oauthUi
      .acceptLogout(logout_challenge)
      .then(data => {
        console.debug('logout resp', data)
      })
      .catch(err => {
        console.debug('err logout', err)
      })
  }, [logout_challenge])

  return <PageContainer msg={'Logging out...'} />
}

export default Logout
