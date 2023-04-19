import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { useCallback, useEffect, useRef } from 'react'

import { OAUTH_CLIENT_ID } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { useIsConnectedWallet } from 'hooks/useSyncNetworkParamWithStore'
import { useSessionInfo } from 'state/authen/hooks'

KyberOauth2.initialize({
  clientId: OAUTH_CLIENT_ID,
  redirectUri: `${window.location.protocol}//${window.location.host}${'/kyberai'}`, // todo
  mode: process.env.REACT_APP_ENV,
})

/**
 * this hook should be call at 1 place
 * @returns
 */
const useLogin = () => {
  const { account } = useActiveWeb3React()
  const isConnectedWallet = useIsConnectedWallet()

  // prevent spam flag
  const requestingAnonymous = useRef(false)
  const requestingSession = useRef<string>()
  const [authen, saveSession] = useSessionInfo()

  const signIn = useCallback(
    async function signIn(walletAddress: string | undefined) {
      const signInAnonymous = async () => {
        saveSession({ loginMethod: LoginMethod.ETH, userInfo: undefined })
        if (!requestingAnonymous.current) {
          requestingAnonymous.current = true
          try {
            const session = await KyberOauth2.loginAnonymous()
            saveSession(session)
          } catch (error) {
            console.log('sign in anonymous err', error)
          }
        }
      }
      try {
        if (requestingSession.current !== walletAddress) {
          requestingSession.current = walletAddress
          const session = await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
          saveSession(session)
        } else if (!walletAddress) {
          signInAnonymous()
        }
      } catch (error) {
        console.log('get session err:', error.message)
        signInAnonymous()
      }
    },
    [saveSession],
  )

  useEffect(() => {
    isConnectedWallet().then(wallet => {
      console.log('checking', wallet, account)
      if (wallet === null) return // pending
      signIn(typeof wallet === 'string' ? wallet : undefined)
    })
  }, [account, signIn, isConnectedWallet])

  return authen
}
export default useLogin
