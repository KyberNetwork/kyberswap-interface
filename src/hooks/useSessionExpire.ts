import KyberOauth2, { KyberOauth2Event, LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useShowConfirm } from 'components/ConfirmModal'
import { APP_PATHS } from 'constants/index'
import useLogin from 'hooks/useLogin'
import { ConfirmModalState } from 'state/application/reducer'
import { useSignedAccountInfo } from 'state/profile/hooks'

export default function useSessionExpiredGlobal() {
  const { pathname } = useLocation()
  const showConfirm = useShowConfirm()
  const { signIn } = useLogin()
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
        onConfirm: () => signIn(),
      }
      const isKyberAIPage =
        pathname.toLowerCase().startsWith(APP_PATHS.KYBERAI.toLowerCase()) &&
        pathname.toLowerCase() !== APP_PATHS.KYBERAI_ABOUT.toLowerCase()

      if (isKyberAIPage && accountId === signedAccount) {
        delete data.cancelText
      }
      showConfirm(data)
    }
    KyberOauth2.on(KyberOauth2Event.SESSION_EXPIRED, listener)
    return () => KyberOauth2.off(KyberOauth2Event.SESSION_EXPIRED, listener)
  }, [pathname, showConfirm, signIn, navigate, signedAccount])

  useEffect(() => {
    const listener = () => {
      try {
        const { signedAccount: newSignedAccount, signedMethod: newLoginMethod } = JSON.parse(
          localStorage.redux_localstorage_simple_profile, // todo
        )
        const accountSignHasChanged = signedMethod !== newLoginMethod || signedAccount !== newSignedAccount
        if (document.visibilityState === 'visible' && accountSignHasChanged) {
          signIn(newSignedAccount, newLoginMethod === LoginMethod.ANONYMOUS)
        }
      } catch (error) {}
    }
    document.addEventListener('visibilitychange', listener)
    return () => {
      document.removeEventListener('visibilitychange', listener)
    }
  }, [signedAccount, signedMethod, signIn])
}
