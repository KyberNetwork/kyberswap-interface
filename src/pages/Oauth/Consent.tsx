import KyberOauth2 from '@kybernetwork/oauth2'
import { useEffect } from 'react'

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
        console.debug('resp consent', data)
      })
      .catch(err => {
        console.debug('err consent', err)
      })
  }, [consent_challenge])

  return <PageContainer msg={'Checking data...'} />
}

export default Page
