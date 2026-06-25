import { Trans, t } from '@lingui/macro'
import { Html5Qrcode } from 'html5-qrcode'
import { useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import FileInput from 'components/FileInput'
import Input from 'components/Input'
import { Label } from 'pages/NotificationCenter/Profile/ExportAccountModal/styled'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'
import { useNotify } from 'state/application/hooks'
import { ExternalLink } from 'theme'

const BTN_CLASS = 'h-9 flex-1 text-sm font-medium leading-5'

type Props = {
  dismissModal: () => void
  onImportToken: (data: { passcode: string; importToken: string }) => void
  loading: boolean
}
const UserEnterPasscodeContent: React.FC<Props> = ({ onImportToken, dismissModal, loading }) => {
  const [passcode, setPasscode] = useState('')
  const [importToken, setImportToken] = useState('')
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
    <div className="flex w-full flex-col gap-4">
      <div id="reader" className="hidden"></div>
      <span className="text-sm font-normal leading-5">
        <Trans>
          You can keep your information synced across all of your devices by importing your profile. Learn more about
          profiles{' '}
          <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/profiles/sync-profile-across-devices">
            here
          </ExternalLink>
          .
        </Trans>
      </span>

      <div className="flex flex-col gap-2">
        <Label>
          <Trans>Your passcode</Trans>
        </Label>

        <Input
          type="password"
          className="text-text"
          maxLength={50}
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder="Enter your passcode"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          <Trans>Your import token</Trans>
        </Label>

        <Input
          className="text-text"
          value={importToken}
          onChange={e => setImportToken(e.target.value)}
          placeholder={t`Enter your Code`}
        />
      </div>

      <FileInput onImgChange={handleFileChange} image width="100%">
        <ButtonEmpty className="m-auto w-fit self-center p-0 text-sm font-normal leading-5">
          <Trans>Or upload QR Code</Trans>
        </ButtonEmpty>
      </FileInput>
      <div className="flex w-full items-center justify-between gap-4">
        <ButtonExport className={BTN_CLASS} onClick={dismissModal} disabled={loading}>
          Cancel
        </ButtonExport>
        <ButtonPrimary
          className={BTN_CLASS}
          disabled={!passcode || passcode.length < 6 || !importToken || loading}
          onClick={() => {
            onImportToken({ passcode, importToken })
          }}
        >
          {loading ? <Trans>Importing...</Trans> : <Trans>Import</Trans>}
        </ButtonPrimary>
      </div>
    </div>
  )
}

export default UserEnterPasscodeContent
