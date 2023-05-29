import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { NotificationType } from 'components/Announcement/type'
import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import {
  ProfileLocalStorageKeys,
  getProfileLocalStorage,
  setProfileLocalStorage,
  useAllProfileInfo,
  useSaveUserProfile,
  useSessionInfo,
  useSetPendingAuthentication,
  useSignedWallet,
} from 'state/authen/hooks'
import { setLoginRedirectUrl } from 'utils/redirectUponLogin'

KyberOauth2.initialize({
  clientId: OAUTH_CLIENT_ID,
  redirectUri: `${window.location.protocol}//${window.location.host}${APP_PATHS.VERIFY_AUTH}`,
  mode: ENV_KEY,
})

const useLogin = (autoLogin = false) => {
  const { account } = useActiveWeb3React()
  const [createProfile] = useGetOrCreateProfileMutation()
  const [connectWalletToProfile] = useConnectWalletToProfileMutation()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const [signedWallet, saveSignedWallet] = useSignedWallet()
  const { refresh: refreshListProfile } = useAllProfileInfo()

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
        setProfile({ profile, isAnonymous, walletAddress })
      } catch (error) {
        const e = new Error('createProfile Error', { cause: error })
        e.name = 'createProfile Error'
        captureException(e, { extra: { walletAddress } })
        setProfile({ profile: undefined, isAnonymous, walletAddress })
      }
    },
    [connectWalletToProfile, createProfile, setProfile],
  )

  const resetState = useCallback(() => {
    setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, undefined)
    saveSignedWallet(undefined)
  }, [saveSignedWallet])

  const signInAnonymous = useCallback(
    async (walletAddress: string | undefined) => {
      if (requestingSessionAnonymous.current) return
      resetState()
      if (anonymousUserInfo) {
        setProfile({ profile: anonymousUserInfo, isAnonymous: true, walletAddress }) // trigger reset account sign in
        requestingSession.current = undefined
        return
      }
      try {
        requestingSessionAnonymous.current = true
        await KyberOauth2.loginAnonymous()
      } catch (error) {
        console.log('sign in anonymous err', error)
      } finally {
        requestingSessionAnonymous.current = false
        await getProfile(walletAddress, true)
        requestingSession.current = undefined
      }
    },
    [anonymousUserInfo, setProfile, getProfile, resetState],
  )

  const requestSignIn = useCallback(
    async (walletAddress: string | undefined, loginAnonymousIfFailed = true) => {
      try {
        if (!walletAddress) {
          throw new Error('Not found address.')
        }
        setLoading(true)
        if (requestingSession.current !== walletAddress?.toLowerCase()) {
          requestingSession.current = walletAddress?.toLowerCase()
          await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
          await getProfile(walletAddress)
          saveSignedWallet(walletAddress)
          setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, undefined)
          !autoLogin &&
            notify({
              type: NotificationType.SUCCESS,
              title: t`Logged in successfully`,
              summary: t`Logged in successfully with the current wallet address`,
            })
        }
      } catch (error) {
        console.log('get session:', walletAddress, error.message)
        if (loginAnonymousIfFailed) {
          await signInAnonymous(walletAddress)
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, signInAnonymous, getProfile, notify, saveSignedWallet, autoLogin],
  )

  const isInit = useRef(false)
  useEffect(() => {
    if (!autoLogin || isInit.current) return // call once
    isInit.current = true
    const wallet = getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET) || signedWallet
    requestSignIn(wallet || undefined)
    // isConnectedWallet().then(wallet => {
    // if (wallet === null) return // pending
    // signIn(typeof wallet === 'string' ? wallet : undefined) // todo remove all related
    // })
  }, [requestSignIn, autoLogin, signedWallet])

  const signInEth = useCallback(
    (walletAddress?: string) => {
      const isAddAccount = !walletAddress
      const isSelectAccount = !!walletAddress

      if (isAddAccount && !account) {
        toggleWalletModal()
        return
      }

      if (
        signedWallet &&
        ((isSelectAccount && signedWallet.toLowerCase() === walletAddress?.toLowerCase()) ||
          (isAddAccount && signedWallet.toLowerCase() === account?.toLowerCase()))
      ) {
        notify({
          type: NotificationType.SUCCESS,
          title: t`Logged in successfully`,
          summary: t`Logged in successfully with the current wallet address`,
        })
        return
      }

      const connectedAccounts = KyberOauth2.getConnectedEthAccounts()
      if (isSelectAccount && connectedAccounts.includes(walletAddress?.toLowerCase() || '')) {
        requestSignIn(walletAddress, false) // todo check case 2 token faild
        return
      }
      if (isAddAccount && connectedAccounts.includes(account?.toLowerCase() || '')) {
        requestSignIn(account, false)
        return
      }
      setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, account)
      KyberOauth2.authenticate({ wallet_address: account ?? '' }) // navigate to login page
      setLoginRedirectUrl()
    },
    [account, notify, signedWallet, requestSignIn, toggleWalletModal],
  )

  const signOut = useCallback(
    (walletAddress?: string) => {
      const onRedirectLogout = () => {
        resetState()
        setLoginRedirectUrl()
        KyberOauth2.logout()
      }
      if (!walletAddress) {
        onRedirectLogout()
        return
      }
      if (walletAddress?.toLowerCase() === signedWallet?.toLowerCase()) {
        onRedirectLogout()
      } else {
        KyberOauth2.removeTokensEthAccount(walletAddress)
        notify({
          type: NotificationType.SUCCESS,
          title: t`Logged out successfully`,
          summary: t`You had successfully logged out`,
        })
        refreshListProfile()
      }
    },
    [resetState, signedWallet, notify, refreshListProfile],
  )

  const signOutAll = useCallback(() => {
    const connectedAccounts = KyberOauth2.getConnectedEthAccounts()
    let needRedirect = false
    connectedAccounts.forEach(address => {
      if (address?.toLowerCase() === signedWallet?.toLowerCase()) {
        needRedirect = true
        return
      }
      KyberOauth2.removeTokensEthAccount(address)
    })
    if (needRedirect) {
      signOut(signedWallet)
      return
    }
    refreshListProfile()
    notify({
      type: NotificationType.SUCCESS,
      title: t`Logged out all accounts successfully`,
      summary: t`You had successfully logged out`,
    })
  }, [notify, refreshListProfile, signedWallet, signOut])

  const wrappedSignInAnonymous = useCallback(() => signInAnonymous(account), [signInAnonymous, account]) // todo rename

  return { signOut, signInEth, signInAnonymous: wrappedSignInAnonymous, signOutAll }
}

export default useLogin
