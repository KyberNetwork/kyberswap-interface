import KyberOauth2, { KyberOauth2Event } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useShowConfirm } from 'components/ConfirmModal'
import { APP_PATHS } from 'constants/index'
import useLogin from 'hooks/useLogin'
import { ConfirmModalState } from 'state/application/reducer'
import { ProfileLocalStorageKeys, getProfileLocalStorage, useSignedWalletInfo } from 'state/authen/hooks'

export default function useSessionExpiredGlobal() {
  const { pathname } = useLocation()
  const showConfirm = useShowConfirm()
  const { signIn, signInAnonymous } = useLogin()
  const { signedWallet } = useSignedWalletInfo()
  const navigate = useNavigate()

  useEffect(() => {
    const listener = () => {
      const isKyberAI = pathname.toLowerCase().startsWith(APP_PATHS.KYBERAI.toLowerCase())
      const data: ConfirmModalState = {
        isOpen: true,
        content: t`Your session has expired. Please sign-in to continue.`,
        title: t`Session Expired`,
        confirmText: t`Sign-in`,
        onConfirm: () => signIn(getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTING_WALLET) || signedWallet),
      }
      if (!isKyberAI) {
        data.cancelText = t`Use Guest Account`
        data.onCancel = () => signInAnonymous()
      }
      showConfirm(data)
    }
    KyberOauth2.on(KyberOauth2Event.SESSION_EXPIRED, listener)
    return () => KyberOauth2.off(KyberOauth2Event.SESSION_EXPIRED, listener)
  }, [pathname, showConfirm, navigate, signedWallet, signIn, signInAnonymous])
}
