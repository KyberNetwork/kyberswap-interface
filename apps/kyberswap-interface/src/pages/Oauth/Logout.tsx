import KyberOauth2 from '@kyberswap/oauth2'
import { Trans } from '@lingui/macro'
import { useEffect } from 'react'

import Dots from 'components/Dots'
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
        console.debug('Oauth logout resp', data)
      })
      .catch(err => {
        console.debug('Oauth logout error', err)
      })
  }, [logout_challenge])

  return (
    <PageContainer
      msg={
        <Dots>
          <Trans>Logging out</Trans>
        </Dots>
      }
    />
  )
}

export default Logout
