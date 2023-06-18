import KyberOauth2, { KyberOauth2Event } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useShowConfirm } from 'components/ConfirmModal'
import { APP_PATHS } from 'constants/index'
import useLogin from 'hooks/useLogin'
import { ConfirmModalState } from 'state/application/reducer'
import { useSignedAccountInfo } from 'state/authen/hooks'

export default function useSessionExpiredGlobal() {
  const { pathname } = useLocation()
  const showConfirm = useShowConfirm()
  const { redirectSignIn } = useLogin()
  const navigate = useNavigate()
  const { signedAccount } = useSignedAccountInfo()

  useEffect(() => {
    const listener = (event: CustomEvent) => {
      const accountId = event?.detail?.accountId
      const data: ConfirmModalState = {
        isOpen: true,
        content: t`Your session has expired. Please sign-in to continue.`,
        title: t`Session Expired`,
        confirmText: t`Sign-in`,
        cancelText: t`Cancel`,
        onConfirm: () => redirectSignIn(),
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
  }, [pathname, showConfirm, redirectSignIn, navigate, signedAccount])
}
