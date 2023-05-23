import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { NotificationType } from 'components/Announcement/type'
import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useIsConnectedWallet } from 'hooks/useSyncNetworkParamWithStore'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useSaveUserProfile, useSessionInfo, useSetPendingAuthentication } from 'state/authen/hooks'

KyberOauth2.initialize({
  clientId: OAUTH_CLIENT_ID,
  redirectUri: `${window.location.protocol}//${window.location.host}${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}`, // todo check AI page for now. profile page
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
  const notify = useNotify()

  const requestingSession = useRef<string>() // which wallet requesting
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
        if (requestingSession.current !== walletAddress) {
          requestingSession.current = walletAddress
          await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
          await getProfile(walletAddress)
          notify({
            type: NotificationType.SUCCESS,
            title: t`Logged in successfully`,
            summary: t`Logged in successfully with the current wallet address`,
          })
          setLoading(false)
        }
      } catch (error) {
        console.log('get session:', walletAddress, error.message)
        signInAnonymous(walletAddress)
      }
    },
    [setLoading, signInAnonymous, getProfile, notify],
  )

  useEffect(() => {
    isConnectedWallet().then(wallet => {
      if (wallet === null) return // pending
      signIn(typeof wallet === 'string' ? wallet : undefined)
    })
  }, [account, signIn, isConnectedWallet])
}

export const useSignInETH = () => {
  const { account } = useActiveWeb3React()
  const { isLogin } = useSessionInfo()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()

  // todo update ux, neu chua login open connect wallet => auto redirect oauth and sign in
  const signInEth = useCallback(() => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (isLogin) {
      notify({
        type: NotificationType.SUCCESS,
        title: t`Logged in successfully`,
        summary: t`Logged in successfully with the current wallet address`,
      })
      return
    }
    KyberOauth2.authenticate({ wallet_address: account ?? '' })
  }, [account, isLogin, notify, toggleWalletModal])

  const signOut = useCallback(() => {
    KyberOauth2.logout({
      // redirectUrl: `${window.location.protocol}//${window.location.host}${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}`,
    })
  }, [])

  return { signInEth, signOut }
}

export default useLogin
