import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'

import { ButtonPrimary } from 'components/Button'
import { MouseoverTooltip } from 'components/Tooltip'
import { Dots } from 'components/swapv2/styleds'
import { useDegenModeManager } from 'state/user/hooks'
import { cn } from 'utils/cn'
import { checkShouldDisableByPriceImpact } from 'utils/priceImpact'
import { checkPriceImpact } from 'utils/prices'

const BUTTON_CLASS = 'flex-1 border-none font-medium disabled:border-none'

const SwapButtonWithPriceImpact = ({
  isProcessingSwap,
  showLoading,
  onClick,
  priceImpact,
  isApproved,
  route,
  disabled,
  showNoteGetRoute,
  disabledText,
  text,
  showTooltipPriceImpact = true,
}: {
  isProcessingSwap: boolean
  showLoading: boolean
  onClick: () => void
  priceImpact: number | undefined
  isApproved: boolean
  route: any
  minimal?: boolean
  disabled?: boolean
  showNoteGetRoute?: boolean
  disabledText?: ReactNode
  text?: ReactNode
  showTooltipPriceImpact?: boolean
}) => {
  const [isDegenMode] = useDegenModeManager()
  const priceImpactResult = checkPriceImpact(priceImpact)

  const [searchParams, setSearchParams] = useSearchParams()

  if (isProcessingSwap) {
    return (
      <ButtonPrimary id="swap-button" className={BUTTON_CLASS} disabled>
        <Dots>
          <Trans>Processing</Trans>
        </Dots>
      </ButtonPrimary>
    )
  }

  if (showLoading) {
    return (
      <ButtonPrimary id="swap-button" className={BUTTON_CLASS} disabled>
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      </ButtonPrimary>
    )
  }

  const shouldDisableByPriceImpact = checkShouldDisableByPriceImpact(isDegenMode, priceImpact)
  const shouldDisable = !route || !isApproved || disabled

  if ((priceImpactResult.isVeryHigh || priceImpactResult.isInvalid) && isDegenMode) {
    return (
      <ButtonPrimary
        id="swap-button"
        className={cn(BUTTON_CLASS, !shouldDisable && '!bg-red !text-text')}
        onClick={onClick}
        disabled={shouldDisable}
      >
        <Trans>Swap Anyway</Trans>
      </ButtonPrimary>
    )
  }

  return (
    <ButtonPrimary
      id="swap-button"
      className={BUTTON_CLASS}
      disabled={shouldDisable}
      onClick={() => {
        if (shouldDisableByPriceImpact && !isDegenMode) {
          searchParams.set('enableDegenMode', 'true')
          setSearchParams(searchParams)
        } else {
          onClick()
        }
      }}
      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
    >
      {shouldDisableByPriceImpact && showTooltipPriceImpact ? (
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
      ) : showNoteGetRoute && showTooltipPriceImpact ? (
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
      <span>
        {shouldDisable
          ? disabledText || t`Swap Disabled`
          : text || (shouldDisableByPriceImpact ? t`Swap Anyway` : t`Swap`)}
      </span>
    </ButtonPrimary>
  )
}
export default SwapButtonWithPriceImpact
