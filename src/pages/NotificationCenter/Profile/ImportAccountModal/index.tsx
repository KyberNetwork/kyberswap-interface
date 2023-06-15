import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import UserEnterPasscodeContent from 'pages/NotificationCenter/Profile/ImportAccountModal/UserEnterPasscodeContent'
import { useNotify } from 'state/application/hooks'
import { ButtonText } from 'theme/components'
import { decryptString } from 'utils/cryptography'

type Props = {
  isOpen: boolean
  onDismiss: () => void
}

export default function ImportAccountModal({ isOpen, onDismiss }: Props) {
  const theme = useTheme()
  const notify = useNotify()
  const { importGuestAccount } = useLogin()
  const handleImportToken = async ({ passcode, importToken }: { passcode: string; importToken: string }) => {
    try {
      let account
      try {
        account = JSON.parse(decryptString(importToken, passcode))
      } catch (error) {
        throw new Error(t`Your passcode or Import Token is invalid`)
      }

      const username = account.username

      if (username === KyberOauth2.getAnonymousAccount()?.username) {
        throw new Error('You can not import your default Guest account')
      }
      if (KyberOauth2.getConnectedAnonymousAccounts().includes(username)) {
        throw new Error('This account is already imported')
      }

      await importGuestAccount(account)
      notify({
        type: NotificationType.SUCCESS,
        title: t`Imported successfully`,
        summary: t`You had successfully import this profile`,
      })
      onDismiss()
    } catch (error) {
      console.log(error)
      notify({
        type: NotificationType.ERROR,
        title: t`Imported unsuccessfully`,
        summary: error?.message || t`Error occur, please try again`,
      })
    }
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
            <Trans>Import Profile</Trans>
          </Text>
          <ButtonText onClick={onDismiss} style={{ lineHeight: '0' }}>
            <X color={theme.text} />
          </ButtonText>
        </Flex>

        <UserEnterPasscodeContent dismissModal={onDismiss} onImportToken={handleImportToken} />
      </Flex>
    </Modal>
  )
}
