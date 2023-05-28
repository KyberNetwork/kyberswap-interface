import KyberOauth2, { KyberOauth2Event } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useShowConfirm } from 'components/ConfirmModal'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ConfirmModalState } from 'state/application/reducer'

export default function useSessionExpiredGlobal() {
  const { pathname } = useLocation()
  const showConfirm = useShowConfirm()
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()

  useEffect(() => {
    const listener = () => {
      const isKyberAI = pathname.toLowerCase().startsWith(APP_PATHS.KYBERAI.toLowerCase())
      if (!isKyberAI) return
      const data: ConfirmModalState = {
        isOpen: true,
        content: t`Your session has expired. Please sign-in to continue.`,
        title: t`Session Expired`,
        confirmText: t`Sign-in`,
        onConfirm: () => KyberOauth2.authenticate({ wallet_address: account ?? '' }),
      }
      showConfirm(data)
    }
    KyberOauth2.on(KyberOauth2Event.SESSION_EXPIRED, listener)
    return () => KyberOauth2.off(KyberOauth2Event.SESSION_EXPIRED, listener)
  }, [pathname, showConfirm, navigate, account])
}
