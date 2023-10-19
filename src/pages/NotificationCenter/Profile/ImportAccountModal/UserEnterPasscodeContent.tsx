import { Trans, t } from '@lingui/macro'
import { Html5Qrcode } from 'html5-qrcode'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import FileInput from 'components/FileInput'
import Input from 'components/Input'
import useTheme from 'hooks/useTheme'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'
import { useNotify } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import { Label } from '../ExportAccountModal/styled'

const ButtonNext = styled(ButtonPrimary)`
  flex: 1;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

const ButtonCancel = styled(ButtonExport)`
  flex: 1;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

type Props = {
  dismissModal: () => void
  onImportToken: (data: { passcode: string; importToken: string }) => void
  loading: boolean
}
const UserEnterPasscodeContent: React.FC<Props> = ({ onImportToken, dismissModal, loading }) => {
  const [passcode, setPasscode] = useState('')
  const [importToken, setImportToken] = useState('')
  const theme = useTheme()
  const notify = useNotify()
  const handleFileChange = (_: string, file: File) => {
    const qr = new Html5Qrcode('reader')
    qr.scanFile(file)
      .then((qrCodeMessage: string) => {
        setImportToken(qrCodeMessage)
      })
      .catch(() => {
        notify({
          type: NotificationType.ERROR,
          title: t`Can not read QR code`,
          summary: t`Your QR code is invalid, please try another one`,
        })
      })
  }

  return (
    <Flex
      sx={{
        width: '100%',
        gap: '16px',
        flexDirection: 'column',
      }}
    >
      <div id="reader" style={{ display: 'none' }}></div>
      <Text
        sx={{
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        <Trans>
          You can keep your information synced across all of your devices by importing your profile. Learn more about
          profiles{' '}
          <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/profiles/sync-profile-across-devices">
            here
          </ExternalLink>
          .
        </Trans>
      </Text>

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Label>
          <Trans>Your passcode</Trans>
        </Label>

        <Input
          type="password"
          color={theme.text}
          maxLength={50}
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder="Enter your passcode"
        />
      </Flex>

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Label>
          <Trans>Your import token</Trans>
        </Label>

        <Input
          color={theme.text}
          value={importToken}
          onChange={e => setImportToken(e.target.value)}
          placeholder={t`Enter your Code`}
        />
      </Flex>

      <FileInput onImgChange={handleFileChange} image width="100%">
        <ButtonEmpty
          style={{
            padding: 0,
            width: 'fit-content',
            alignSelf: 'center',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            margin: 'auto',
          }}
        >
          <Trans>Or upload QR Code</Trans>
        </ButtonEmpty>
      </FileInput>
      <Flex
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          gap: '16px',
        }}
      >
        <ButtonCancel onClick={dismissModal} disabled={loading}>
          Cancel
        </ButtonCancel>
        <ButtonNext
          disabled={!passcode || passcode.length < 6 || !importToken || loading}
          onClick={() => {
            onImportToken({ passcode, importToken })
          }}
        >
          {loading ? <Trans>Importing...</Trans> : <Trans>Import</Trans>}
        </ButtonNext>
      </Flex>
    </Flex>
  )
}

export default UserEnterPasscodeContent
