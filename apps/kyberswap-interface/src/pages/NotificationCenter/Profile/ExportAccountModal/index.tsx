import KyberOauth2 from '@kyberswap/oauth2'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'

import Modal from 'components/Modal'
import QRCodeContent from 'pages/NotificationCenter/Profile/ExportAccountModal/QRCodeContent'
import UserEnterPasscodeContent from 'pages/NotificationCenter/Profile/ExportAccountModal/UserEnterPasscodeContent'
import { useImportToken } from 'state/profile/hooks'
import { ButtonText } from 'theme/components'
import { encryptString } from 'utils/cryptography'

enum Step {
  ENTER_PASSCODE,
  QR_CODE,
}

type Props = {
  isOpen: boolean
  onDismiss: () => void
}
export default function ExportAccountModal({ isOpen, onDismiss }: Props) {
  const guestAccount = useMemo(() => KyberOauth2.getAnonymousAccount(), [])
  const guestAccountStr = guestAccount ? JSON.stringify(guestAccount) : ''
  const { getImportToken, removeImportToken, saveImportToken } = useImportToken()

  const getStep = useCallback(
    (account: string) => {
      const storedImportToken = getImportToken(account)

      if (storedImportToken) {
        return Step.QR_CODE
      }

      return Step.ENTER_PASSCODE
    },
    [getImportToken],
  )

  const [step, setStep] = useState(() => {
    return getStep(guestAccount?.username ?? '')
  })

  const [importToken, setImportToken] = useState(() => {
    const storedImportToken = getImportToken(guestAccount?.username ?? '')
    if (storedImportToken) {
      return storedImportToken
    }

    return ''
  })

  const handleConfirmPasscode = (code: string) => {
    if (!guestAccount?.username) {
      return
    }

    setStep(Step.QR_CODE)

    const importToken = encryptString(guestAccountStr, code)
    saveImportToken(guestAccount.username, importToken)
    setImportToken(importToken)
  }

  const handleForgotPasscode = () => {
    if (!guestAccount?.username) {
      return
    }

    removeImportToken(guestAccount.username)
    setStep(Step.ENTER_PASSCODE)
  }

  useEffect(() => {
    if (isOpen) {
      setStep(getStep(guestAccount?.username ?? ''))
    }
  }, [guestAccount?.username, isOpen, getStep])

  if (!guestAccountStr) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false} maxWidth={420} width={'420px'}>
      <div className="flex w-full flex-col items-center gap-4 p-6">
        <div className="flex w-full justify-between">
          <span className="text-lg font-medium">
            <Trans>Export Profile</Trans>
          </span>
          <ButtonText onClick={onDismiss} className="leading-[0]">
            <X className="text-text" />
          </ButtonText>
        </div>

        {step === Step.ENTER_PASSCODE ? (
          <UserEnterPasscodeContent dismissModal={onDismiss} onEnterPasscode={handleConfirmPasscode} />
        ) : null}
        {step === Step.QR_CODE && importToken ? (
          <QRCodeContent dismissModal={onDismiss} importToken={importToken} forgotPasscode={handleForgotPasscode} />
        ) : null}
      </div>
    </Modal>
  )
}
