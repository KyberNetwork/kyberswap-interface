import KyberOauth2, { AnonymousAccount, LoginMethod } from '@kyberswap/oauth2'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback, useEffect, useRef } from 'react'
import { usePrevious } from 'react-use'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { NotificationType } from 'components/Announcement/type'
import { useShowConfirm } from 'components/ConfirmModal'
import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import {
  useIsAutoLoginAfterConnectWallet,
  useSetConfirmChangeProfile,
  useSetPendingAuthentication,
} from 'state/authen/hooks'
import {
  KEY_GUEST_DEFAULT,
  useGetProfileDisplayName,
  useIsKeepCurrentProfile,
  useProfileInfo,
  useSaveConnectedProfile,
  useSaveUserProfile,
  useSignedAccountInfo,
} from 'state/profile/hooks'
import { setLoginRedirectUrl } from 'utils/redirectUponLogin'
import { isEmailValid } from 'utils/string'

export const initializeOauthKyberSwap = () => {
  KyberOauth2.initialize({
    clientId: OAUTH_CLIENT_ID,
    redirectUri: `${window.location.protocol}//${window.location.host}${APP_PATHS.VERIFY_AUTH}`,
    mode: ENV_KEY,
  })
}

initializeOauthKyberSwap()

const useLogin = (autoLogin = false) => {
  const { account } = useActiveWeb3React()

  const [createProfile] = useGetOrCreateProfileMutation()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const { signedMethod, signedAccount } = useSignedAccountInfo()
  const saveSignedAccount = useSaveConnectedProfile()
  const { removeProfile, removeAllProfile, totalGuest } = useProfileInfo()
  const getProfileName = useGetProfileDisplayName()
  const showConfirm = useShowConfirm()
  const setLoading = useSetPendingAuthentication()
  const setProfile = useSaveUserProfile()

  const getProfile = useCallback(
    async ({
      walletAddress,
      loginMethod,
      account,
    }: {
      walletAddress: string | undefined
      loginMethod: LoginMethod
      account: string
    }) => {
      const isAnonymous = loginMethod === LoginMethod.ANONYMOUS
      try {
        const profile = await createProfile().unwrap()
        const formatProfile = { ...profile }
        setProfile({ profile: formatProfile, isAnonymous, account })
      } catch (error) {
        const e = new Error('createProfile Error', { cause: error })
        e.name = 'createProfile Error'
        captureException(e, { extra: { walletAddress, account }, level: 'warning' })
        setProfile({ profile: undefined, isAnonymous, account })
      }
    },
    [createProfile, setProfile],
  )

  const showSignInSuccess = useCallback(
    (desireAccount: string | undefined, loginMethod: LoginMethod) => {
      const isGuest = loginMethod === LoginMethod.ANONYMOUS
      if (autoLogin) return
      const name = getProfileName(desireAccount, isGuest)
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Signed in successfully`,
          summary:
            desireAccount?.toLowerCase() === account?.toLowerCase()
              ? t`Connected successfully with the current wallet address.`
              : isGuest
              ? t`Connected successfully with Guest Profile.`
              : t`Connected successfully with profile ${name}.`,
        },
        10_000,
      )
    },
    [account, notify, autoLogin, getProfileName],
  )

  const signInAnonymous = useCallback(
    async (guestAccountParam?: string, showSuccessMsg = true) => {
      const guestAccount = guestAccountParam || KEY_GUEST_DEFAULT
      let hasError = false
      try {
        setLoading(true)
        await KyberOauth2.loginAnonymous(guestAccount === KEY_GUEST_DEFAULT ? undefined : guestAccount)
        saveSignedAccount({ account: guestAccount, method: LoginMethod.ANONYMOUS })
      } catch (error) {
        console.log('sign in anonymous err', error)
        hasError = true
      } finally {
        setLoading(false)
        await getProfile({
          walletAddress: account,
          account: guestAccount,
          loginMethod: LoginMethod.ANONYMOUS,
        })
        !hasError && showSuccessMsg && showSignInSuccess(guestAccount, LoginMethod.ANONYMOUS)
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
          isEmailValid(desireAccount) || !desireAccount
            ? { account: desireAccount }
            : { method: LoginMethod.ETH, account: desireAccount },
        )
        const respAccount = userInfo.email || userInfo.wallet_address || desireAccount
        saveSignedAccount({ account: respAccount, method: loginMethod })
        await getProfile({
          walletAddress: respAccount,
          loginMethod,
          account: respAccount,
        })
        showSignInSuccess(respAccount, loginMethod)
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

  const redirectSignIn = useCallback((account: string, loginMethod = LoginMethod.ETH) => {
    if (window.location.pathname.startsWith(APP_PATHS.IAM_LOGIN)) return
    setLoginRedirectUrl(window.location.href)
    const accountKey = loginMethod === LoginMethod.ETH ? 'wallet_address' : 'email'
    KyberOauth2.authenticate({ [accountKey]: account, type: loginMethod }) // navigate to login page
  }, [])

  // check account info and redirect if needed
  const [, setAutoSignIn] = useIsAutoLoginAfterConnectWallet()
  const signIn = useCallback(
    async ({
      desireAccount,
      showSessionExpired,
      loginMethod = LoginMethod.ETH,
    }: {
      desireAccount?: string
      showSessionExpired?: boolean
      loginMethod?: LoginMethod
    }) => {
      const isAddAccount = !desireAccount
      const isSelectAccount = !!desireAccount
      const isEth = loginMethod === LoginMethod.ETH

      if (isAddAccount && !account && isEth) {
        toggleWalletModal()
        setAutoSignIn({ value: true, account: desireAccount })
        return
      }
      setAutoSignIn({ value: false, account: undefined })

      const connectedAccounts = KyberOauth2.getConnectedAccounts()
      const isTokenExist = connectedAccounts.includes(desireAccount?.toLowerCase() || '')
      if (isSelectAccount && isTokenExist) {
        await checkSessionSignIn(desireAccount, false)
        return
      }

      const formatAccount = desireAccount || (isEth ? account : '') || ''
      if (showSessionExpired && isSelectAccount && !isTokenExist) {
        showConfirm({
          isOpen: true,
          content: t`Your session has expired. Please sign-in to continue.`,
          title: t`Session Expired`,
          confirmText: t`Sign-in`,
          onConfirm: () => redirectSignIn(formatAccount, loginMethod),
          cancelText: t`Cancel`,
        })
        return
      }
      redirectSignIn(formatAccount, loginMethod)
    },
    [account, checkSessionSignIn, toggleWalletModal, showConfirm, setAutoSignIn, redirectSignIn],
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
        }, 1000)
        return
      }
      KyberOauth2.removeConnectedAccount(desireAccount)
      showSignOutSuccess()
      removeProfile(desireAccount)
    },
    [signedAccount, showSignOutSuccess, removeProfile],
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
    if (needRedirect) {
      signOut(signedAccount)
      removeAllProfile()
      return
    }
    removeAllProfile()
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
      return KyberOauth2.importAnonymousAccount(accountInfo).then(() => signInAnonymous(accountId, false))
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
    ({
      account,
      loginMethod = LoginMethod.ETH,
      showSessionExpired = false,
    }: {
      account?: string
      loginMethod?: LoginMethod
      showSessionExpired?: boolean
    } = {}) => {
      return loginMethod === LoginMethod.ANONYMOUS
        ? signInAnonymous(account)
        : signIn({ desireAccount: account, showSessionExpired, loginMethod })
    },
    [signInAnonymous, signIn],
  )

  return {
    signOut: signOutWrapped,
    signIn: signInWrapped,
    redirectSignIn,
    signOutAll,
    importGuestAccount,
    checkSessionSignIn,
    signInAnonymous,
  }
}

export const useAutoLogin = () => {
  const { signedMethod, signedAccount } = useSignedAccountInfo()
  const qs = useParsedQueryString()
  const { account } = useActiveWeb3React()
  const [isKeepCurrentProfile] = useIsKeepCurrentProfile()
  const { signIn, checkSessionSignIn, signInAnonymous } = useLogin(true)

  // auto try sign in when the first visit app, call once
  const isInit = useRef(false)
  useEffect(() => {
    if (isInit.current) return
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
  }, [checkSessionSignIn, signedAccount, signedMethod, signInAnonymous, qs.code])

  // auto sign in after connect wallet
  const [{ value: needSignInAfterConnectWallet, account: accountSignAfterConnectedWallet }, setAutoSignIn] =
    useIsAutoLoginAfterConnectWallet()
  useEffect(() => {
    if (!account || !needSignInAfterConnectWallet) return
    signIn({ account: accountSignAfterConnectedWallet })
    setAutoSignIn({ value: false, account: undefined })
  }, [account, needSignInAfterConnectWallet, accountSignAfterConnectedWallet, signIn, setAutoSignIn])

  const setConfirm = useSetConfirmChangeProfile()

  // show confirm change profile when change wallet
  const prevAccount = usePrevious(account)
  useEffect(() => {
    if (
      !isKeepCurrentProfile &&
      prevAccount &&
      account &&
      account !== prevAccount &&
      signedMethod === LoginMethod.ETH &&
      signedAccount?.toLowerCase() !== account?.toLowerCase()
    ) {
      setConfirm(true)
    }
  }, [account, setConfirm, signedAccount, isKeepCurrentProfile, prevAccount, signedMethod])
}

export default useLogin
