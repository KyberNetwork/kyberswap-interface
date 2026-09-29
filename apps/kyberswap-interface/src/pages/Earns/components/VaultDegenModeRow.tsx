import { t } from '@lingui/macro'
import { useState } from 'react'

import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import { SettingsToggle } from 'components/TransactionSettings/components'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { InfoLabel, InfoRow } from 'pages/Earns/components/VaultDeposit/styles'
import { useDegenModeManager } from 'state/user/hooks'
import { cn } from 'utils/cn'

/**
 * The setting that lets a route the form would otherwise refuse go through. It sits among the terms
 * rather than behind a gear, so the action that points at it has something on screen to point to;
 * `highlight` is how it answers.
 *
 * The state is the app's own, shared with the pool zaps under Earn, and turning it on goes through
 * the same confirmation they do.
 */
const VaultDegenModeRow = ({ highlight }: { highlight?: boolean }) => {
  const { trackingHandler } = useTracking()
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleToggle = () => {
    // Turning it off is immediate; turning it on is the step worth being sure about.
    if (isDegenMode) {
      toggleDegenMode()
      trackingHandler(TRACKING_EVENT_TYPE.DEGEN_MODE_TOGGLE, { type: 'off' })
      setShowConfirmation(false)
      return
    }
    setShowConfirmation(true)
  }

  return (
    <>
      <InfoRow
        data-highlight={highlight}
        className={cn('-m-1 items-center rounded-lg p-1', 'data-[highlight=true]:animate-highlight')}
      >
        <InfoLabel
          tooltip={t`Turn this on to make trades with very high price impact. This can result in bad rates and loss of funds. Be cautious.`}
        >{t`Degen Mode`}</InfoLabel>
        <SettingsToggle isActive={isDegenMode} toggle={handleToggle} />
      </InfoRow>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}

export default VaultDegenModeRow
