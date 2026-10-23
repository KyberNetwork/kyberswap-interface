import { Trans } from '@lingui/macro'
import { type Dispatch, type SetStateAction } from 'react'

import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import { SettingsLabel, SettingsRow, SettingsToggle } from 'components/TransactionSettings/components'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDegenModeManager } from 'state/user/hooks'

type Props = {
  showConfirmation: boolean
  setShowConfirmation: Dispatch<SetStateAction<boolean>>
  highlight?: boolean
}

export const DegenModeSetting = ({ showConfirmation, setShowConfirmation, highlight = false }: Props) => {
  const { trackingHandler } = useTracking()

  const [isDegenMode, toggleDegenMode] = useDegenModeManager()

  const handleToggleDegenMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      trackingHandler(TRACKING_EVENT_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'off',
      })
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  return (
    <>
      <SettingsRow data-highlight={highlight} className="-m-1 rounded-lg p-1 data-[highlight=true]:animate-highlight">
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

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}
