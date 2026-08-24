import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { HStack } from 'components/Stack'
import {
  SidePanelCard,
  type SidePanelCardWrapperProps,
} from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/helpers'

type CopyCapitalCardProps = SidePanelCardWrapperProps & {
  addCapitalAvailability?: AdvisoryActionAvailability
  capital: string
  stopCopyAvailability?: AdvisoryActionAvailability
  onView?: () => void
  onAddCapital?: () => void
  onStopCopy?: () => void
}

export const CopyCapitalCard = ({
  addCapitalAvailability,
  capital,
  stopCopyAvailability,
  title = 'Your Current Copy',
  onView,
  onAddCapital,
  onStopCopy,
  ...sidePanelCardProps
}: CopyCapitalCardProps) => {
  const addCapitalDisabled = !isActionAvailable(addCapitalAvailability)
  const stopCopyDisabled = !isActionAvailable(stopCopyAvailability)
  const hasActions = !!onStopCopy || !!onView || !!onAddCapital

  return (
    <SidePanelCard {...sidePanelCardProps} title={title}>
      <HStack className="items-center justify-between">
        <span className="text-subText">Capital In</span>
        <span className="text-xl font-medium text-primary">{capital}</span>
      </HStack>
      {hasActions && (
        <HStack className="gap-3">
          {onStopCopy && (
            <div className="w-full flex-1">
              <ButtonLight
                type="button"
                padding="10px 12px"
                color="var(--ks-red)"
                disabled={stopCopyDisabled}
                title={stopCopyDisabled ? getPreparedReasonMessage(stopCopyAvailability?.reason) : undefined}
                onClick={onStopCopy}
              >
                Stop Copy
              </ButtonLight>
            </div>
          )}
          {onView && (
            <div className="w-full flex-1">
              <ButtonLight type="button" padding="10px 12px" onClick={onView}>
                My Copy
              </ButtonLight>
            </div>
          )}
          {onAddCapital && (
            <div className="w-full flex-1">
              <ButtonPrimary
                type="button"
                padding="10px 12px"
                disabled={addCapitalDisabled}
                title={addCapitalDisabled ? getPreparedReasonMessage(addCapitalAvailability?.reason) : undefined}
                onClick={onAddCapital}
              >
                Add Capital
              </ButtonPrimary>
            </div>
          )}
        </HStack>
      )}
    </SidePanelCard>
  )
}

export const WithdrawQuoteCard = ({
  availability,
  onWithdraw,
}: {
  availability?: AdvisoryActionAvailability
  onWithdraw: () => void
}) => {
  const disabled = !isActionAvailable(availability)

  return (
    <SidePanelCard title="Advanced">
      <p className="text-sm text-subText">Withdraw available quote balance without selling positions.</p>
      <ButtonLight
        type="button"
        disabled={disabled}
        title={disabled ? getPreparedReasonMessage(availability?.reason) : undefined}
        onClick={onWithdraw}
      >
        Withdraw
      </ButtonLight>
    </SidePanelCard>
  )
}
