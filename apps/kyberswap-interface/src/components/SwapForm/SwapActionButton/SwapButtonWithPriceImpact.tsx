import { Trans, t } from '@lingui/macro'
import { Info } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { MouseoverTooltip } from 'components/Tooltip'
import type { PriceImpactAction } from 'utils/prices'

type Props = {
  isProcessingSwap: boolean
  showLoading: boolean
  onClick: () => void
  priceImpactAction: PriceImpactAction
  isApproved: boolean
  hasRoute: boolean
}

const SwapButtonWithPriceImpact = ({
  isProcessingSwap,
  showLoading,
  onClick,
  priceImpactAction,
  isApproved,
  hasRoute,
}: Props) => {
  if (isProcessingSwap) {
    return (
      <ButtonPrimary id="swap-button" disabled>
        <Dots>
          <Trans>Processing</Trans>
        </Dots>
      </ButtonPrimary>
    )
  }

  if (showLoading) {
    return (
      <ButtonPrimary id="swap-button" disabled>
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      </ButtonPrimary>
    )
  }

  const shouldDisable = !hasRoute || !isApproved

  if (priceImpactAction === 'swap-anyway') {
    return (
      <ButtonPrimary
        id="swap-button"
        className={!shouldDisable ? '!bg-red !text-text' : undefined}
        onClick={onClick}
        disabled={shouldDisable}
      >
        <Trans>Swap Anyway</Trans>
      </ButtonPrimary>
    )
  }

  return (
    <ButtonPrimary id="swap-button" className="gap-1" disabled={shouldDisable} onClick={onClick}>
      {priceImpactAction === 'enable-degen' ? (
        <MouseoverTooltip
          text={
            <Trans>
              By clicking this, you will proceed by enabling Degen Mode. We recommend double-checking the minimum
              received amount before confirming the swap.
            </Trans>
          }
        >
          <Info size={14} />
        </MouseoverTooltip>
      ) : !hasRoute ? (
        <MouseoverTooltip
          text={
            <Trans>
              There was an issue while trying to find a price for these tokens. Please try again. Otherwise, you may
              select some other tokens to swap.
            </Trans>
          }
        >
          <Info size={14} />
        </MouseoverTooltip>
      ) : null}
      <span>{shouldDisable ? t`Swap Disabled` : priceImpactAction === 'enable-degen' ? t`Swap Anyway` : t`Swap`}</span>
    </ButtonPrimary>
  )
}
export default SwapButtonWithPriceImpact
