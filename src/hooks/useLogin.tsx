import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useIsConnectedWallet } from 'hooks/useSyncNetworkParamWithStore'
import { useSaveUserProfile, useSessionInfo, useSetPendingAuthentication } from 'state/authen/hooks'

KyberOauth2.initialize({
  clientId: OAUTH_CLIENT_ID,
  redirectUri: `${window.location.protocol}//${window.location.host}${APP_PATHS.KYBERAI_ABOUT}`, // limit only kyber AI page for now
  mode: ENV_KEY,
})

/**
 * this hook should be call at 1 place
 * @returns
 */
const useLogin = () => {
  const { account } = useActiveWeb3React()
  const isConnectedWallet = useIsConnectedWallet()
  const [createProfile] = useGetOrCreateProfileMutation()
  const [connectWalletToProfile] = useConnectWalletToProfileMutation()

  const requestingSession = useRef(false)
  const requestingSessionAnonymous = useRef(false)

  const { anonymousUserInfo } = useSessionInfo()

  const setLoading = useSetPendingAuthentication()

  const setProfile = useSaveUserProfile()

  const getProfile = useCallback(
    async (walletAddress: string | undefined, isAnonymous = false) => {
      try {
        let profile = await createProfile().unwrap()
        if (walletAddress) {
          await connectWalletToProfile({ walletAddress })
          profile = await createProfile().unwrap()
        }
        setProfile({ profile, isAnonymous })
      } catch (error) {
        const e = new Error('createProfile Error', { cause: error })
        e.name = 'createProfile Error'
        captureException(e, { extra: { walletAddress } })
        setProfile({ profile: undefined, isAnonymous })
      }
    },
    [connectWalletToProfile, createProfile, setProfile],
  )

  const signInAnonymous = useCallback(
    async (walletAddress: string | undefined) => {
      if (requestingSessionAnonymous.current) return
      if (anonymousUserInfo) {
        setProfile({ profile: anonymousUserInfo, isAnonymous: true }) // trigger reset account sign in
        return
      }
      try {
        requestingSessionAnonymous.current = true
        await KyberOauth2.loginAnonymous()
      } catch (error) {
        console.log('sign in anonymous err', error)
      } finally {
        requestingSessionAnonymous.current = false
        setLoading(false)
        getProfile(walletAddress, true)
      }
    },
    [anonymousUserInfo, setProfile, setLoading, getProfile],
  )

  const signIn = useCallback(
    async (walletAddress: string | undefined) => {
      try {
        if (!walletAddress) {
          throw new Error('Not found address.')
        }
        if (requestingSession.current) return
        requestingSession.current = true
        await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
        await getProfile(walletAddress)
        setLoading(false)
      } catch (error) {
        console.log('get session:', walletAddress, error.message)
        signInAnonymous(walletAddress)
      } finally {
        requestingSession.current = false
      }
    },
    [setLoading, signInAnonymous, getProfile],
  )

  useEffect(() => {
    isConnectedWallet().then(wallet => {
      if (wallet === null) return // pending
      signIn(typeof wallet === 'string' ? wallet : account || undefined)
    })
  }, [account, signIn, isConnectedWallet])
}
export default useLogin
