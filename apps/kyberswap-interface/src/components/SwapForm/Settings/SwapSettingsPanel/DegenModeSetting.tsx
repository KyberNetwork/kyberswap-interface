import { Trans } from '@lingui/macro'

import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import { SettingsLabel, SettingsRow, SettingsToggle } from 'components/TransactionSettings/components'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDegenModeManager } from 'state/user/hooks'

type Props = {
  showConfirmation: boolean
  onConfirmationChange: (visible: boolean) => void
  highlight?: boolean
}

export const DegenModeSetting = ({ showConfirmation, onConfirmationChange, highlight = false }: Props) => {
  const { trackingHandler } = useTracking()

  const [isDegenMode, toggleDegenMode] = useDegenModeManager()

  const handleToggleDegenMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      trackingHandler(TRACKING_EVENT_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'off',
      })
      onConfirmationChange(false)
      return
    }

    // need confirmation before turning it on
    onConfirmationChange(true)
  }

  return (
    <>
      <SettingsRow
        data-highlight={highlight}
        className="relative before:pointer-events-none before:absolute before:-inset-1 before:rounded-lg before:content-[''] data-[highlight=true]:before:animate-highlight"
      >
        <SettingsLabel
          tooltip={
            <Trans>
              Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
              result in bad rates and loss of funds. Be cautious.
            </Trans>
          }
        >
          <Trans>Degen Mode</Trans>
        </SettingsLabel>
        <SettingsToggle id="toggle-expert-mode-button" isActive={isDegenMode} toggle={handleToggleDegenMode} />
      </SettingsRow>

      <AdvanceModeModal show={showConfirmation} onDismiss={() => onConfirmationChange(false)} />
    </>
  )
}
