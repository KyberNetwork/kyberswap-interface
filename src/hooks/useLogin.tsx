import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { isAuthorized } from 'hooks/web3/useEagerConnect'
import { useSaveUserProfile, useSetPendingAuthentication } from 'state/authen/hooks'

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
  const [createProfile] = useGetOrCreateProfileMutation()
  const [connectWalletToProfile] = useConnectWalletToProfileMutation()

  const requestingSession = useRef<string>() // which wallet requesting
  const requestingSessionAnonymous = useRef(false)

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
    [setLoading, getProfile],
  )

  const signIn = useCallback(
    async (walletAddress: string | undefined) => {
      try {
        if (!walletAddress) {
          throw new Error('Not found address.')
        }
        if (requestingSession.current !== walletAddress) {
          requestingSession.current = walletAddress
          setLoading(true)
          await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
          await getProfile(walletAddress)
          setLoading(false)
        }
      } catch (error) {
        console.log('get session:', walletAddress, error.message)
        signInAnonymous(walletAddress)
      }
    },
    [setLoading, signInAnonymous, getProfile],
  )

  const latestAccount = useRef<string | boolean | undefined>('')
  useEffect(() => {
    const requestSignIn = (wallet: string | boolean | undefined) => {
      if (latestAccount.current === wallet) {
        return //  not change
      }
      latestAccount.current = wallet
      signIn(typeof wallet === 'string' ? wallet : account)
    }
    if (latestAccount.current && !account) {
      // disconnect
      requestingSession.current = undefined
      requestSignIn(account)
      return
    }
    isAuthorized().then(requestSignIn)
  }, [account, signIn])
}
export default useLogin
