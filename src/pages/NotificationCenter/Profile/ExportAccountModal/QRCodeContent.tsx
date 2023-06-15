import { Trans } from '@lingui/macro'
import { useMemo, useRef } from 'react'
import { QRCode, IProps as QRCodeProps } from 'react-qrcode-logo'
import { Flex } from 'rebass'
import styled from 'styled-components'

import KncLogo from 'assets/images/kyber_logo_for_qr.png'
import { AddressInput as AddressInputPanel } from 'components/AddressInputPanel'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Deposit from 'components/Icons/Deposit'
import useTheme from 'hooks/useTheme'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'

import { Label } from './styled'

const QR_SIZE = 200
const QR_ID = 'react-qrcode-logo'

const AddressInput = styled(AddressInputPanel)`
  width: 100%;
`

const ButtonDone = styled(ButtonPrimary)`
  flex: 1;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

const ButtonDownloadQR = styled(ButtonExport)`
  flex: 1;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

type Props = {
  importToken: string
  dismissModal: () => void
  forgotPasscode: () => void
}

export default function QRCodeContent({ dismissModal, importToken, forgotPasscode }: Props) {
  const theme = useTheme()
  const copyButtonRef = useRef<HTMLDivElement>(null)

  const qrCodeProps: QRCodeProps | undefined = useMemo(() => {
    return {
      logoImage: KncLogo,
      logoWidth: 32,
      logoHeight: 32,
      size: QR_SIZE,
      // `ethereum` is intentional. This QR is used to open the Send feature on the wallet (e.g. Metamask)
      // Chain is not switched by this prefix
      value: importToken,
      eyeColor: { outer: '#000000', inner: '#000000' },
      quietZone: 14,
      removeQrCodeBehindLogo: true,
    }
  }, [importToken])

  let qrElement = null
  try {
    qrElement = qrCodeProps ? <QRCode {...qrCodeProps} /> : <Flex sx={{ width: '228px', height: '228px' }} />
  } catch (e) {
    qrElement = (
      <Flex
        sx={{
          // match size of QR
          width: '228px',
          height: '228px',
          borderRadius: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          border: `2px solid ${theme.border}`,
          textAlign: 'center',
          color: theme.subText,
          fontSize: '14px',
        }}
      >
        <Trans>
          Something went wrong,
          <br />
          please try again
        </Trans>
      </Flex>
    )
  }

  const downloadQR = () => {
    try {
      const canvas = document.getElementById(QR_ID) as HTMLCanvasElement
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'your-guest-account.png'

      link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
      link.click()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Flex
      flexDirection="column"
      width="100%"
      sx={{
        gap: '16px',
      }}
    >
      <Flex
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          margin: '8px 0',
        }}
      >
        {qrElement}
      </Flex>

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
        }}
      >
        <Label>
          <Trans>Your import token (click to copy)</Trans>
        </Label>

        <AddressInput
          onClick={() => {
            copyButtonRef.current?.click?.()
          }}
          style={{ color: theme.subText, cursor: 'pointer', width: '100%' }}
          disabled
          value={importToken}
          icon={<CopyHelper ref={copyButtonRef} toCopy={importToken} style={{ color: theme.subText }} />}
          pattern={null}
        />
      </Flex>

      <ButtonEmpty
        style={{
          padding: 0,
          width: 'fit-content',
          alignSelf: 'center',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
        }}
        onClick={forgotPasscode}
      >
        <Trans>Forgot your Passcode?</Trans>
      </ButtonEmpty>

      <Flex
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          gap: '16px',
        }}
      >
        <ButtonDownloadQR onClick={downloadQR}>
          <Deposit
            width={18}
            height={18}
            style={{
              marginRight: '4px',
            }}
          />
          Download QR
        </ButtonDownloadQR>

        <ButtonDone onClick={dismissModal}>Done</ButtonDone>
      </Flex>
    </Flex>
  )
}
