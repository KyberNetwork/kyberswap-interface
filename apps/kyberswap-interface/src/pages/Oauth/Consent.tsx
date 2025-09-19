import KyberOauth2 from '@kyberswap/oauth2'
import { Trans } from '@lingui/macro'
import { useEffect } from 'react'

import Dots from 'components/Dots'
import { ENV_KEY } from 'constants/env'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { PageContainer } from 'pages/Oauth/styled'

function Page() {
  const { consent_challenge } = useParsedQueryString<{ consent_challenge: string }>()

  useEffect(() => {
    if (!consent_challenge) return
    KyberOauth2.initialize({ mode: ENV_KEY })
    KyberOauth2.oauthUi
      .getFlowConsent(consent_challenge)
      .then(data => {
        console.debug('Oauth resp consent', data)
      })
      .catch(err => {
        console.debug('Oauth consent error', err)
      })
  }, [consent_challenge])

  return (
    <PageContainer
      msg={
        <Dots>
          <Trans>Checking data</Trans>
        </Dots>
      }
    />
  )
}

export default Page
