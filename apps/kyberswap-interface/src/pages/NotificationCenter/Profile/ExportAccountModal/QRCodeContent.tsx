import { Trans } from '@lingui/macro'
import { useMemo, useRef } from 'react'
import { QRCode, IProps as QRCodeProps } from 'react-qrcode-logo'

import KncLogo from 'assets/images/kyber_logo_for_qr.png'
import { AddressInput } from 'components/AddressInputPanel'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Deposit from 'components/Icons/Deposit'
import useTheme from 'hooks/useTheme'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'

import { Label } from './styled'

const QR_SIZE = 200
const QR_ID = 'react-qrcode-logo'

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
      value: importToken,
      eyeColor: { outer: '#000000', inner: '#000000' },
      quietZone: 14,
      removeQrCodeBehindLogo: true,
    }
  }, [importToken])

  let qrElement = null
  try {
    qrElement = qrCodeProps ? <QRCode {...qrCodeProps} /> : <div className="h-[228px] w-[228px]" />
  } catch (e) {
    qrElement = (
      <div className="flex h-[228px] w-[228px] items-center justify-center rounded-2xl border-2 border-solid border-border text-center text-sm text-subText">
        <Trans>
          Something went wrong,
          <br />
          please try again
        </Trans>
      </div>
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
    <div className="flex w-full flex-col gap-4">
      <div className="my-2 flex items-center justify-center">{qrElement}</div>

      <div className="flex w-full flex-col gap-2">
        <Label>
          <Trans>Your import token (click to copy)</Trans>
        </Label>

        <AddressInput
          onClick={() => {
            copyButtonRef.current?.click?.()
          }}
          className="w-full"
          style={{ color: theme.subText, cursor: 'pointer' }}
          disabled
          value={importToken}
          icon={<CopyHelper ref={copyButtonRef} toCopy={importToken} className="text-subText" />}
          pattern={null}
        />
      </div>

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

      <div className="flex w-full items-center justify-between gap-4">
        <ButtonExport onClick={downloadQR} className="!h-9 flex-1 text-sm font-medium leading-5">
          <Deposit width={18} height={18} style={{ marginRight: '4px' }} />
          Download QR
        </ButtonExport>

        <ButtonPrimary onClick={dismissModal} className="!h-9 flex-1 text-sm font-medium leading-5">
          Done
        </ButtonPrimary>
      </div>
    </div>
  )
}
