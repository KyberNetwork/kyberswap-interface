import KyberOauth2 from '@kybernetwork/oauth2'
import { useEffect, useRef } from 'react'

import { OAUTH_CLIENT_ID } from 'constants/env'

const useLogin = () => {
  // prevent spam because react 18 strict mode
  const requestingAnonymous = useRef(false)
  useEffect(() => {
    const signIn = async function signIn() {
      try {
        const ClientAppConfig = { clientId: OAUTH_CLIENT_ID }
        KyberOauth2.initialize(ClientAppConfig)
        if (!requestingAnonymous.current) {
          requestingAnonymous.current = true
          const data = await KyberOauth2.loginAnonymous()
          console.log(data)
        }
      } catch (error) {
        console.log('get info anonymous err', error)
      }
    }
    signIn()
  }, [])

  return null
}
export default useLogin
