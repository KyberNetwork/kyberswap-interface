import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import useLogin from 'hooks/useLogin'
import UserEnterPasscodeContent from 'pages/NotificationCenter/Profile/ImportAccountModal/UserEnterPasscodeContent'
import { useNotify } from 'state/application/hooks'
import { ButtonText } from 'theme/components'
import { decryptString } from 'utils/cryptography'

type Props = {
  isOpen: boolean
  onDismiss: () => void
}

export default function ImportAccountModal({ isOpen, onDismiss }: Props) {
  const notify = useNotify()
  const [loading, setLoading] = useState(false)

  const { importGuestAccount } = useLogin()
  const handleImportToken = async ({ passcode, importToken }: { passcode: string; importToken: string }) => {
    try {
      let account
      try {
        account = JSON.parse(decryptString(importToken, passcode))
      } catch (error) {
        throw new Error(t`Your passcode or Import Token is invalid`)
      }

      setLoading(true)
      await importGuestAccount(account)
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Imported successfully`,
          summary: t`You had successfully import this profile. You are now signed in with this guest account`,
        },
        10_000,
      )
      onDismiss()
    } catch (error) {
      console.log(error)
      notify({
        type: NotificationType.ERROR,
        title: t`Imported unsuccessfully`,
        summary: error?.message || t`Error occur, please try again`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false} maxWidth={420} width={'420px'}>
      <div className="flex w-full flex-col items-center gap-4 p-6">
        <div className="flex w-full justify-between">
          <span className="text-lg font-medium">
            <Trans>Import Profile</Trans>
          </span>
          <ButtonText onClick={onDismiss} style={{ lineHeight: '0' }}>
            <X className="text-text" />
          </ButtonText>
        </div>

        <UserEnterPasscodeContent dismissModal={onDismiss} onImportToken={handleImportToken} loading={loading} />
      </div>
    </Modal>
  )
}
