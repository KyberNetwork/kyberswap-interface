import { Trans } from '@lingui/macro'
import { useRef } from 'react'

import KncLogo from 'assets/images/kyber_logo_for_qr.png'
import { AddressInput } from 'components/AddressInputPanel'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Deposit from 'components/Icons/Deposit'
import QRCodeWithLogo from 'components/QRCodeWithLogo'
import { Label } from 'pages/NotificationCenter/Profile/ExportAccountModal/styled'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'

const QR_SIZE = 200
const QR_ID = 'export-account-qr-code'

type Props = {
  importToken: string
  dismissModal: () => void
  forgotPasscode: () => void
}

export default function QRCodeContent({ dismissModal, importToken, forgotPasscode }: Props) {
  const copyButtonRef = useRef<HTMLDivElement>(null)

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
      <div className="my-2 flex items-center justify-center">
        <QRCodeWithLogo
          id={QR_ID}
          value={importToken}
          logoImage={KncLogo}
          logoWidth={32}
          logoHeight={32}
          size={QR_SIZE}
          quietZone={14}
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label>
          <Trans>Your import token (click to copy)</Trans>
        </Label>

        <AddressInput
          onClick={() => {
            copyButtonRef.current?.click?.()
          }}
          className="w-full"
          inputClassName="cursor-pointer !text-subText"
          disabled
          value={importToken}
          icon={<CopyHelper ref={copyButtonRef} toCopy={importToken} className="text-subText" />}
          pattern={null}
        />
      </div>

      <ButtonEmpty className="w-fit self-center p-0 text-sm font-normal leading-5" onClick={forgotPasscode}>
        <Trans>Forgot your Passcode?</Trans>
      </ButtonEmpty>

      <div className="flex w-full items-center justify-between gap-4">
        <ButtonExport onClick={downloadQR} className="!h-9 flex-1 text-sm font-medium leading-5">
          <Deposit width={18} height={18} className="mr-1" />
          Download QR
        </ButtonExport>

        <ButtonPrimary onClick={dismissModal} className="!h-9 flex-1 text-sm font-medium leading-5">
          Done
        </ButtonPrimary>
      </div>
    </div>
  )
}
