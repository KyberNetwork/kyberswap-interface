import KyberOauth2, { AnonymousAccount, LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { usePrevious } from 'react-use'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileMutation } from 'services/identity'

import { NotificationType } from 'components/Announcement/type'
import { useShowConfirm } from 'components/ConfirmModal'
import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import {
  KEY_GUEST_DEFAULT,
  useProfileInfo,
  useSaveUserProfile,
  useSessionInfo,
  useSetConfirmProfile,
  useSetPendingAuthentication,
  useSignedAccountInfo,
} from 'state/authen/hooks'
import { useIsKeepCurrentProfile, useLoginRedirectUrl, useSaveConnectedProfile } from 'state/profile/hooks'
import { filterTruthy, isAddress } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { isEmailValid } from 'utils/string'

KyberOauth2.initialize({
  clientId: OAUTH_CLIENT_ID,
  redirectUri: `${window.location.protocol}//${window.location.host}${APP_PATHS.VERIFY_AUTH}`,
  mode: ENV_KEY,
})

let needSignInAfterConnectWallet = false
let accountSignAfterConnectedWallet: string | undefined
const useLogin = (autoLogin = false) => {
  const { account, chainId } = useActiveWeb3React()
  const { userInfo } = useSessionInfo()
  const [isKeepCurrentProfile] = useIsKeepCurrentProfile()

  const [createProfile] = useGetOrCreateProfileMutation()
  const [connectWalletToProfile] = useConnectWalletToProfileMutation()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const [, setLoginRedirectUrl] = useLoginRedirectUrl()
  const { signedMethod, signedAccount } = useSignedAccountInfo()
  const saveSignedAccount = useSaveConnectedProfile()
  const { removeProfile, removeAllProfile, totalGuest } = useProfileInfo()
  const showConfirm = useShowConfirm()
  const qs = useParsedQueryString()
  const setLoading = useSetPendingAuthentication()
  const setProfile = useSaveUserProfile()

  const getProfile = useCallback(
    async ({
      walletAddress,
      isAnonymous,
      session,
      account,
    }: {
      walletAddress: string | undefined
      isAnonymous: boolean
      account: string
      session: any
    }) => {
      try {
        const profile = await createProfile().unwrap()
        if (walletAddress && isAddress(chainId, walletAddress)) {
          await connectWalletToProfile({ walletAddress })
        }

        const formatProfile = { ...profile }
        if (isEmailValid(account) && session) {
          // sign in with google
          formatProfile.avatarUrl = session?.picture ?? ''
          formatProfile.email = session?.email ?? ''
          formatProfile.nickname = filterTruthy([session?.first_name, session?.last_name]).join(' ')
        }
        setProfile({ profile: formatProfile, isAnonymous, account })
      } catch (error) {
        const e = new Error('createProfile Error', { cause: error })
        e.name = 'createProfile Error'
        captureException(e, { extra: { walletAddress, account } })
        setProfile({ profile: undefined, isAnonymous, account })
      }
    },
    [connectWalletToProfile, createProfile, setProfile, chainId],
  )

  const showSignInSuccess = useCallback(
    (desireAccount: string | undefined, guest = false) =>
      !autoLogin &&
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Signed in successfully`,
          summary:
            desireAccount?.toLowerCase() === account?.toLowerCase()
              ? t`Signed in successfully with the current wallet address`
              : t`Signed in successfully with ${
                  isEmailValid(desireAccount)
                    ? `email ${desireAccount}`
                    : guest
                    ? `guest account`
                    : `wallet ${getShortenAddress(desireAccount ?? '')}`
                }`,
        },
        10_000,
      ),
    [account, notify, autoLogin],
  )

  const signInAnonymous = useCallback(
    async (guestAccountParam?: string, showSuccessMsg = true) => {
      let userInfo
      const guestAccount = guestAccountParam || KEY_GUEST_DEFAULT
      let hasError = false
      try {
        setLoading(true)
        const resp = await KyberOauth2.loginAnonymous(guestAccount === KEY_GUEST_DEFAULT ? undefined : guestAccount)
        userInfo = resp.userInfo
        saveSignedAccount({ account: guestAccount, method: LoginMethod.ANONYMOUS })
      } catch (error) {
        console.log('sign in anonymous err', error)
        hasError = true
      } finally {
        setLoading(false)
        await getProfile({ walletAddress: account, isAnonymous: true, account: guestAccount, session: userInfo })
        !hasError && showSuccessMsg && showSignInSuccess(guestAccount, true)
      }
    },
    [getProfile, setLoading, account, saveSignedAccount, showSignInSuccess],
  )

  // check session when sign in eth/email
  const checkSessionSignIn = useCallback(
    async (desireAccount: string | undefined, loginAnonymousIfFailed = true) => {
      try {
        setLoading(true)
        const { loginMethod, userInfo } = await KyberOauth2.getSession(
          isEmailValid(desireAccount ?? '') || !desireAccount
            ? { account: desireAccount }
            : { method: LoginMethod.ETH, account: desireAccount },
        )
        const respAccount = userInfo.email || userInfo.wallet_address || desireAccount
        saveSignedAccount({ account: respAccount, method: loginMethod })
        await getProfile({
          walletAddress: respAccount,
          isAnonymous: false,
          session: userInfo,
          account: respAccount,
        })
        showSignInSuccess(respAccount)
      } catch (error) {
        console.log('sdk get session err:', desireAccount, error.message)
        if (loginAnonymousIfFailed) {
          await signInAnonymous(KyberOauth2.getConnectedAnonymousAccounts()[0])
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, signInAnonymous, getProfile, saveSignedAccount, showSignInSuccess],
  )

  // check account info and redirect if needed
  const signIn = useCallback(
    async (desireAccount?: string, showSessionExpired = false) => {
      const isAddAccount = !desireAccount
      const isSelectAccount = !!desireAccount

      if (isAddAccount && !account) {
        toggleWalletModal()
        needSignInAfterConnectWallet = true
        accountSignAfterConnectedWallet = desireAccount
        return
      }
      needSignInAfterConnectWallet = false

      const connectedAccounts = KyberOauth2.getConnectedAccounts()
      const isTokenExist = connectedAccounts.includes(desireAccount?.toLowerCase() || '')
      if (isSelectAccount && isTokenExist) {
        await checkSessionSignIn(desireAccount, false)
        return
      }

      const redirectSignIn = () => {
        setLoginRedirectUrl(window.location.href)
        setTimeout(() => {
          KyberOauth2.authenticate({ wallet_address: desireAccount ?? '' }) // navigate to login page
        }, 500)
      }
      if (showSessionExpired && isSelectAccount && !isTokenExist) {
        showConfirm({
          isOpen: true,
          content: t`Your session has expired. Please sign-in to continue.`,
          title: t`Session Expired`,
          confirmText: t`Sign-in`,
          onConfirm: () => redirectSignIn(),
          cancelText: t`Cancel`,
        })
        return
      }
      redirectSignIn()
    },
    [account, checkSessionSignIn, toggleWalletModal, showConfirm, setLoginRedirectUrl],
  )

  const showSignOutSuccess = useCallback(() => {
    notify(
      {
        type: NotificationType.SUCCESS,
        title: t`Signed out successfully`,
        summary: t`You had successfully signed out`,
      },
      10_000,
    )
  }, [notify])

  const signOut = useCallback(
    (desireAccount?: string) => {
      if (!desireAccount || desireAccount?.toLowerCase() === signedAccount?.toLowerCase()) {
        setLoginRedirectUrl(window.location.href)
        removeProfile(desireAccount)
        setTimeout(() => {
          KyberOauth2.logout()
        }, 500)
        return
      }
      KyberOauth2.removeConnectedAccount(desireAccount)
      showSignOutSuccess()
      removeProfile(desireAccount)
    },
    [signedAccount, showSignOutSuccess, removeProfile, setLoginRedirectUrl],
  )

  const signOutAll = useCallback(() => {
    let needRedirect = false
    KyberOauth2.getConnectedAccounts().forEach(acc => {
      if (acc?.toLowerCase() === signedAccount?.toLowerCase()) {
        needRedirect = true
        return
      }
      KyberOauth2.removeConnectedAccount(acc)
    })
    const guestAccounts = KyberOauth2.getConnectedAnonymousAccounts()
    guestAccounts.forEach(e => {
      if (e?.toLowerCase() === signedAccount?.toLowerCase() || guestAccounts.length === 1) {
        return
      }
      KyberOauth2.removeAnonymousAccount(e)
    })
    removeAllProfile()
    if (needRedirect) {
      signOut(signedAccount)
      return
    }
    notify(
      {
        type: NotificationType.SUCCESS,
        title: t`Signed out all accounts successfully`,
        summary: t`You had successfully signed out`,
      },
      10_000,
    )
  }, [notify, removeAllProfile, signedAccount, signOut])

  const signOutAnonymous = useCallback(
    (guestAccount: string | undefined) => {
      if (!guestAccount || totalGuest <= 1) return

      KyberOauth2.removeAnonymousAccount(guestAccount)
      if (signedMethod === LoginMethod.ANONYMOUS && signedAccount === guestAccount) {
        signInAnonymous(KyberOauth2.getConnectedAnonymousAccounts()[0])
      }
      removeProfile(guestAccount, true)
      showSignOutSuccess()
    },
    [signInAnonymous, removeProfile, totalGuest, showSignOutSuccess, signedAccount, signedMethod],
  )

  const importGuestAccount = useCallback(
    async (accountInfo: AnonymousAccount) => {
      const accountId = accountInfo.username
      KyberOauth2.importAnonymousAccount(accountInfo)
      return signInAnonymous(accountId, false)
    },
    [signInAnonymous],
  )

  const signOutWrapped = useCallback(
    (desireAccount: string | undefined, isGuest: boolean) => {
      return isGuest ? signOutAnonymous(desireAccount) : signOut(desireAccount)
    },
    [signOutAnonymous, signOut],
  )

  const signInWrapped = useCallback(
    (desireAccount: string | undefined = undefined, isGuest = false, showSessionExpired = false) => {
      return isGuest ? signInAnonymous(desireAccount) : signIn(desireAccount, showSessionExpired)
    },
    [signInAnonymous, signIn],
  )
  // todo split to 2 hook???
  // todo move all localstorage to redux persist

  // auto try sign in when the first visit app, call once
  const isInit = useRef(false)

  useEffect(() => {
    if (!autoLogin || isInit.current) return
    isInit.current = true
    if (qs.code) {
      // redirect from server
      checkSessionSignIn(undefined)
      return
    }
    if (signedMethod === LoginMethod.ANONYMOUS) {
      signInAnonymous(signedAccount)
      return
    }
    checkSessionSignIn(signedAccount || undefined)
  }, [checkSessionSignIn, autoLogin, signedAccount, signedMethod, signInAnonymous, qs.code])

  // auto sign in after connect wallet
  useEffect(() => {
    if (autoLogin || !account || !needSignInAfterConnectWallet) return
    signIn(accountSignAfterConnectedWallet)
    needSignInAfterConnectWallet = false
  }, [account, signIn, autoLogin])

  useEffect(() => {
    if (signedMethod === LoginMethod.ANONYMOUS && account && autoLogin && userInfo?.identityId) {
      try {
        connectWalletToProfile({ walletAddress: account })
      } catch (error) {}
    }
  }, [account, connectWalletToProfile, autoLogin, userInfo?.identityId, signedMethod])

  const setConfirm = useSetConfirmProfile()

  // only run when change wallet
  const prevAccount = usePrevious(account)
  useEffect(() => {
    if (
      !isKeepCurrentProfile &&
      prevAccount &&
      account &&
      account !== prevAccount &&
      autoLogin &&
      signedMethod === LoginMethod.ETH &&
      signedAccount?.toLowerCase() !== account?.toLowerCase()
    ) {
      setConfirm({ showModal: true })
    }
  }, [account, autoLogin, setConfirm, signedAccount, isKeepCurrentProfile, prevAccount, signedMethod])

  return { signOut: signOutWrapped, signIn: signInWrapped, signOutAll, importGuestAccount }
}

export default useLogin
