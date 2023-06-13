import KyberOauth2, { AnonymousAccount, LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { ANNOUNCEMENT_TAGS } from 'services/announcement'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { useInvalidateTagAnnouncement } from 'components/Announcement/helper'
import { NotificationType } from 'components/Announcement/type'
import { useShowConfirm } from 'components/ConfirmModal'
import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import {
  KEY_GUEST_DEFAULT,
  ProfileLocalStorageKeys,
  getProfileLocalStorage,
  setProfileLocalStorage,
  useAllProfileInfo,
  useSaveUserProfile,
  useSetPendingAuthentication,
  useSignedWallet,
} from 'state/authen/hooks'
import getShortenAddress from 'utils/getShortenAddress'
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

  const requestingSessionAnonymous = useRef(false)

  const setLoading = useSetPendingAuthentication()
  const setProfile = useSaveUserProfile()
  const invalidateTag = useInvalidateTagAnnouncement()

  const getProfile = useCallback(
    async ({
      walletAddress,
      isAnonymous,
      guestAccount,
    }: {
      walletAddress: string | undefined
      isAnonymous: boolean
      guestAccount: string
    }) => {
      try {
        const profile = await createProfile().unwrap()
        invalidateTag(ANNOUNCEMENT_TAGS) // todo find the best way
        if (walletAddress) {
          await connectWalletToProfile({ walletAddress })
        }
        setProfile({ profile, isAnonymous, walletAddress, guestAccount })
      } catch (error) {
        const e = new Error('createProfile Error', { cause: error })
        e.name = 'createProfile Error'
        captureException(e, { extra: { walletAddress } })
        setProfile({ profile: undefined, isAnonymous, walletAddress, guestAccount })
      }
    },
    [connectWalletToProfile, createProfile, setProfile, invalidateTag],
  )

  const resetState = useCallback(() => {
    setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, undefined)
    saveSignedWallet(undefined)
  }, [saveSignedWallet])

  const signInAnonymous = useCallback(
    async (walletAddress: string | undefined, guestAccountParam?: string) => {
      const guestAccount =
        guestAccountParam || getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_GUEST) || KEY_GUEST_DEFAULT
      if (requestingSessionAnonymous.current) return
      resetState()
      // if (anonymousUserInfo) { // todo check
      //   setProfile({ profile: anonymousUserInfo, isAnonymous: true, walletAddress: undefined }) // trigger reset account sign in
      //   return
      // }
      try {
        requestingSessionAnonymous.current = true
        console.log('sign ano', guestAccount)
        await KyberOauth2.loginAnonymous(guestAccount === KEY_GUEST_DEFAULT ? undefined : guestAccount)
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_GUEST, guestAccount)
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_WALLET, undefined)
      } catch (error) {
        console.log('sign in anonymous err', error)
      } finally {
        requestingSessionAnonymous.current = false
        await getProfile({ walletAddress, isAnonymous: true, guestAccount })
      }
    },
    [getProfile, resetState],
  )
  const wrappedSignInAnonymous = useCallback(
    (guestAccount?: string) =>
      signInAnonymous(account, guestAccount || getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_GUEST)),
    [signInAnonymous, account],
  )

  const showNotiSuccess = useCallback(
    (walletAddress: string | undefined) =>
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Logged in successfully`,
          summary:
            walletAddress?.toLowerCase() === account?.toLowerCase()
              ? t`Logged in successfully with the current wallet address`
              : t`Logged in successfully with wallet ${getShortenAddress(walletAddress ?? '')}`,
        },
        10_000,
      ),
    [account, notify],
  )

  const requestSignIn = useCallback(
    async (walletAddress: string | undefined, loginAnonymousIfFailed = true) => {
      try {
        if (!walletAddress) {
          throw new Error('Not found address.')
        }
        setLoading(true)
        await KyberOauth2.getSession({ method: LoginMethod.ETH, account: walletAddress })
        await getProfile({ walletAddress, isAnonymous: false, guestAccount: '' })
        saveSignedWallet(walletAddress)
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, undefined)
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_GUEST, undefined)
        !autoLogin && showNotiSuccess(walletAddress)
      } catch (error) {
        console.log('get session:', walletAddress, error.message)
        if (loginAnonymousIfFailed) {
          await signInAnonymous(walletAddress, getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_GUEST))
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, signInAnonymous, getProfile, saveSignedWallet, autoLogin, showNotiSuccess],
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
        showNotiSuccess(walletAddress)
        return
      }

      const doSignIn = (address: string | undefined) => {
        setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET, address)
        requestSignIn(address, false)
      }

      const connectedAccounts = KyberOauth2.getConnectedAccounts()
      if (isSelectAccount && connectedAccounts.includes(walletAddress?.toLowerCase() || '')) {
        doSignIn(walletAddress)
        return
      }
      if (isAddAccount && connectedAccounts.includes(account?.toLowerCase() || '')) {
        doSignIn(account)
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
    [account, signedWallet, requestSignIn, toggleWalletModal, showConfirm, showNotiSuccess],
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
        KyberOauth2.removeConnectedAccount(walletAddress)
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Logged out successfully`,
            summary: t`You had successfully logged out`,
          },
          10_000,
        )
        removeProfile(walletAddress)
      }
    },
    [resetState, signedWallet, notify, removeProfile],
  )

  const signOutAll = useCallback(() => {
    const connectedAccounts = KyberOauth2.getConnectedAccounts()
    let needRedirect = false
    connectedAccounts.forEach(address => {
      if (address?.toLowerCase() === signedWallet?.toLowerCase()) {
        needRedirect = true
        return
      }
      KyberOauth2.removeConnectedAccount(address)
    })
    KyberOauth2.getConnectedAnonymousAccounts().forEach(e => KyberOauth2.removeAnonymousAccount(e))
    removeAllProfile()
    if (needRedirect) {
      signOut(signedWallet)
      return
    }
    notify(
      {
        type: NotificationType.SUCCESS,
        title: t`Logged out all accounts successfully`,
        summary: t`You had successfully logged out`,
      },
      10_000,
    )
  }, [notify, removeAllProfile, signedWallet, signOut])

  const importGuestAccount = useCallback(
    async (accountInfo: AnonymousAccount) => {
      try {
        const accountId = accountInfo.username
        await KyberOauth2.importAnonymousAccount(accountInfo)
        signInAnonymous(account, accountId)
      } catch (error) {
        console.log('import error', error)
        notify({
          type: NotificationType.ERROR,
          title: t`Import guest account error`,
          summary: t`Import guest account error, please try again`,
        })
      }
    },
    [signInAnonymous, notify, account],
  )

  const signOutAnonymous = useCallback(
    (guestAccount: string) => {
      KyberOauth2.removeAnonymousAccount(guestAccount)
      signInAnonymous(account, KEY_GUEST_DEFAULT)
      removeProfile(guestAccount, true)
    },
    [account, signInAnonymous, removeProfile],
  )

  // todo remove and remove .d.ts as well
  window.KyberOauth2 = importGuestAccount
  return { signOut, signIn, signInAnonymous: wrappedSignInAnonymous, signOutAll, importGuestAccount, signOutAnonymous }
}

export default useLogin
