import KyberOauth2, { KyberOauth2Event, LoginMethod } from '@kyberswap/oauth2'
import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useShowConfirm } from 'components/ConfirmModal'
import { APP_PATHS } from 'constants/index'
import useLogin from 'hooks/useLogin'
import { ConfirmModalState } from 'state/application/reducer'
import { useSignedAccountInfo } from 'state/profile/hooks'
import { isEmailValid } from 'utils/string'

export default function useSessionExpiredGlobal() {
  const { pathname } = useLocation()
  const showConfirm = useShowConfirm()
  const { signIn, redirectSignIn, signInAnonymous } = useLogin()
  const navigate = useNavigate()
  const { signedAccount, signedMethod } = useSignedAccountInfo()

  useEffect(() => {
    const listener = (event: CustomEvent) => {
      const accountId = event?.detail?.accountId
      const data: ConfirmModalState = {
        isOpen: true,
        content: t`Your session has expired. Please sign-in to continue.`,
        title: t`Session Expired`,
        confirmText: t`Sign-in`,
        cancelText: t`Cancel`,
        onConfirm: () => {
          const account = accountId || signedAccount
          redirectSignIn(account, isEmailValid(account) ? LoginMethod.EMAIL : undefined)
        },
        onCancel: () => {
          signInAnonymous(KyberOauth2.getConnectedAnonymousAccounts()[0])
        },
      }

      const isIAMPages = [APP_PATHS.IAM_CONSENT, APP_PATHS.IAM_LOGIN, APP_PATHS.IAM_LOGOUT].includes(pathname)
      if (!isIAMPages) showConfirm(data)
    }
    KyberOauth2.on(KyberOauth2Event.SESSION_EXPIRED, listener)
    return () => KyberOauth2.off(KyberOauth2Event.SESSION_EXPIRED, listener)
  }, [pathname, showConfirm, redirectSignIn, navigate, signedAccount, signInAnonymous])

  useEffect(() => {
    const listener = () => {
      try {
        const { signedAccount: newSignedAccount, signedMethod: newLoginMethod } = JSON.parse(
          localStorage.redux_localstorage_simple_profile, // this is the good one for now. when change window tab, localstorage changed but redux not change
        )
        const accountSignHasChanged = signedMethod !== newLoginMethod || signedAccount !== newSignedAccount
        if (document.visibilityState === 'visible' && accountSignHasChanged) {
          // sync account in multi window tab
          signIn({ account: newSignedAccount, loginMethod: newLoginMethod })
        }
      } catch (error) {}
    }
    document.addEventListener('visibilitychange', listener)
    return () => {
      document.removeEventListener('visibilitychange', listener)
    }
  }, [signedAccount, signedMethod, signIn])
}
