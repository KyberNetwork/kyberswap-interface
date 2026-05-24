import { Trans } from '@lingui/macro'
import { useState } from 'react'

import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'
import { ExternalLink } from 'theme'

import { Label } from './styled'

const BTN_CLASS = 'h-9 flex-1 text-sm font-medium leading-5'

type Props = {
  dismissModal: () => void
  onEnterPasscode: (v: string) => void
}
const UserEnterPasscodeContent: React.FC<Props> = ({ onEnterPasscode, dismissModal }) => {
  const [passcode, setPasscode] = useState('')
  return (
    <div className="flex w-full flex-col gap-4">
      <span className="text-sm font-normal leading-5">
        <Trans>
          Exported profiles will not be associated with your wallet. Your export code is unique. Learn more about
          profile{' '}
          <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/profiles/sync-profile-across-devices">
            here
          </ExternalLink>
          .
        </Trans>
      </span>
      <span className="text-sm font-normal leading-5">
        <Trans>First, you will need to create a passcode</Trans>
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

        <span className="text-xs font-normal italic leading-4">
          <Trans>Your passcode must be at least 6 characters long</Trans>
        </span>
      </div>

      <div className="flex w-full items-center justify-between gap-4">
        <ButtonExport className={BTN_CLASS} onClick={dismissModal}>
          Cancel
        </ButtonExport>
        <ButtonPrimary
          className={BTN_CLASS}
          disabled={!passcode || passcode.length < 6}
          onClick={() => {
            onEnterPasscode(passcode)
          }}
        >
          <Trans>Next</Trans>
        </ButtonPrimary>
      </div>
    </div>
  )
}

export default UserEnterPasscodeContent
