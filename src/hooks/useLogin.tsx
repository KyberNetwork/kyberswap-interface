import KyberOauth2 from '@kybernetwork/oauth2'
import { useEffect } from 'react'

import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'

const useLogin = () => {
  useEffect(() => {
    const signIn = async function signIn() {
      try {
        KyberOauth2.initialize({ clientId: OAUTH_CLIENT_ID, mode: ENV_KEY })
        await KyberOauth2.loginAnonymous()
      } catch (error) {
        console.log('get info anonymous err', error)
      }
    }
    signIn()
  }, [])
}
export default useLogin
