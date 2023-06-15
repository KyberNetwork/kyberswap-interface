import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import QRCodeContent from 'pages/NotificationCenter/Profile/ExportAccountModal/QRCodeContent'
import UserEnterPasscodeContent from 'pages/NotificationCenter/Profile/ExportAccountModal/UserEnterPasscodeContent'
import { ButtonText } from 'theme/components'
import { decryptString, encryptString } from 'utils/cryptography'
import { getGuestAccount, getImportToken, removeImportToken, saveImportToken } from 'utils/profile'

enum Step {
  ENTER_PASSCODE,
  QR_CODE,
}

const getStep = (account: string) => {
  const storedImportToken = getImportToken(account)

  if (storedImportToken) {
    return Step.QR_CODE
  }

  return Step.ENTER_PASSCODE
}

type Props = {
  isOpen: boolean
  onDismiss: () => void
}
export default function ExportAccountModal({ isOpen, onDismiss }: Props) {
  const theme = useTheme()
  const guestAccount = useMemo(() => getGuestAccount(), [])
  const guestAccountStr = guestAccount ? JSON.stringify(guestAccount) : ''

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

    console.log({
      text: decryptString(importToken, code),
    })
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
  }, [guestAccount?.username, isOpen])

  if (!guestAccountStr) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false} maxWidth={420} width={'420px'}>
      <Flex
        flexDirection="column"
        alignItems="center"
        padding="24px"
        width="100%"
        sx={{
          gap: '16px',
        }}
      >
        <Flex width="100%" justifyContent={'space-between'}>
          <Text fontSize={18} fontWeight={500}>
            <Trans>Export Profile</Trans>
          </Text>
          <ButtonText onClick={onDismiss} style={{ lineHeight: '0' }}>
            <X color={theme.text} />
          </ButtonText>
        </Flex>

        {step === Step.ENTER_PASSCODE ? (
          <UserEnterPasscodeContent dismissModal={onDismiss} onEnterPasscode={handleConfirmPasscode} />
        ) : null}
        {step === Step.QR_CODE && importToken ? (
          <QRCodeContent dismissModal={onDismiss} importToken={importToken} forgotPasscode={handleForgotPasscode} />
        ) : null}
      </Flex>
    </Modal>
  )
}
