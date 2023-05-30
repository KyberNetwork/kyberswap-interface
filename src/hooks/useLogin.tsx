import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { NotificationType } from 'components/Announcement/type'
import { useShowConfirm } from 'components/ConfirmModal'
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

let needSignInAfterConnectWallet = false
let accountSignAfterConnectedWallet: string | undefined
const useLogin = (autoLogin = false) => {
  const { account } = useActiveWeb3React()
  const [createProfile] = useGetOrCreateProfileMutation()
  const [connectWalletToProfile] = useConnectWalletToProfileMutation()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const [signedWallet, saveSignedWallet] = useSignedWallet()
  const { removeProfile, removeAllProfile } = useAllProfileInfo()
  const showConfirm = useShowConfirm()

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
  const wrappedSignInAnonymous = useCallback(() => signInAnonymous(account), [signInAnonymous, account])

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

  const signIn = useCallback(
    (walletAddress?: string, showSessionExpired = false) => {
      const isAddAccount = !walletAddress
      const isSelectAccount = !!walletAddress

      if (isAddAccount && !account) {
        toggleWalletModal()
        needSignInAfterConnectWallet = true
        accountSignAfterConnectedWallet = walletAddress
        return
      }
      needSignInAfterConnectWallet = false
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
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, walletAddress)
        requestSignIn(walletAddress, false)
        return
      }
      if (isAddAccount && connectedAccounts.includes(account?.toLowerCase() || '')) {
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, account)
        requestSignIn(account, false)
        return
      }

      const redirect = () => {
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, walletAddress || account)
        KyberOauth2.authenticate({ wallet_address: walletAddress || account || '' }) // navigate to login page
        setLoginRedirectUrl()
      }

      if (showSessionExpired && isSelectAccount && !connectedAccounts.includes(walletAddress?.toLowerCase())) {
        showConfirm({
          isOpen: true,
          content: t`Your session has expired. Please sign-in to continue.`,
          title: t`Session Expired`,
          confirmText: t`Sign-in`,
          onConfirm: () => redirect(),
          cancelText: t`Cancel`,
        })
        return
      }
      redirect()
    },
    [account, notify, signedWallet, requestSignIn, toggleWalletModal, showConfirm],
  )

  // auto try sign in when the first visit app, call once
  const isInit = useRef(false)
  useEffect(() => {
    if (!autoLogin || isInit.current) return
    isInit.current = true
    const wallet = getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET) || signedWallet
    requestSignIn(wallet || undefined)
  }, [requestSignIn, autoLogin, signedWallet])

  // auto sign in after connect wallet
  useEffect(() => {
    if (autoLogin || !account || !needSignInAfterConnectWallet) return
    signIn(accountSignAfterConnectedWallet)
    needSignInAfterConnectWallet = false
  }, [account, signIn, autoLogin])

  const signOut = useCallback(
    (walletAddress?: string) => {
      const onRedirectLogout = () => {
        resetState()
        setLoginRedirectUrl()
        removeProfile(walletAddress)
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
        removeProfile(walletAddress)
      }
    },
    [resetState, signedWallet, notify, removeProfile],
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
    removeAllProfile()
    if (needRedirect) {
      signOut(signedWallet)
      return
    }
    notify({
      type: NotificationType.SUCCESS,
      title: t`Logged out all accounts successfully`,
      summary: t`You had successfully logged out`,
    })
  }, [notify, removeAllProfile, signedWallet, signOut])

  return { signOut, signIn, signInAnonymous: wrappedSignInAnonymous, signOutAll }
}

export default useLogin
