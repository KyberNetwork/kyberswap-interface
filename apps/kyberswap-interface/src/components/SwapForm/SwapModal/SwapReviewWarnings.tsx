import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonError, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ErrorWarning } from 'components/ErrorWarning'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD, isSlippageBuildError } from 'components/SwapForm/SwapModal/reviewData'
import type { SwapReviewData } from 'components/SwapForm/SwapModal/useSwapReviewData'
import PriceImpactNote from 'components/SwapForm/Warnings/PriceImpactNote'
import { MouseoverTooltip } from 'components/Tooltip'

const ReservedOrderNotice = ({ symbol, to }: { symbol: string | undefined; to: string }) => (
  <ErrorWarning
    type="warn"
    title={
      <Trans>
        <span className="text-text">Notice</span>: Some of your {symbol} is already reserved by an open Limit Order -
        review it <Link to={to}>here</Link>.
      </Trans>
    }
  />
)

const BuildErrorMessage = ({
  errorWhileBuildRoute,
  honeypot,
}: {
  errorWhileBuildRoute: string
  honeypot: SwapReviewData['honeypot']
}) => {
  if (!errorWhileBuildRoute) return
  if (errorWhileBuildRoute.toLowerCase().includes('permit')) {
    return (
      <div>
        <Trans>
          There was an issue while trying to confirm your price. <b>Permit signature invalid</b>
        </Trans>
      </div>
    )
  }

  if (honeypot?.isHoneypot) {
    return (
      <div>
        This token might be a honeypot token and could be unsellable. Please consult the project team for further
        assistance
      </div>
    )
  }

  if (honeypot?.isFOT) {
    return (
      <div>
        This token has a Fee-on-Transfer. Please increase the slippage to at least {honeypot.tax * 100}% to proceed.
      </div>
    )
  }

  if (isSlippageBuildError(errorWhileBuildRoute)) {
    return (
      <div>
        <Trans>
          There was an issue while confirming your price and minimum amount received. You may consider adjusting your{' '}
          <b>Max Slippage</b> and then trying to swap again.
        </Trans>
      </div>
    )
  }
  if (
    errorWhileBuildRoute.includes(
      'Please use a different wallet to fill an order that you created via the KyberSwap Limit Order',
    )
  )
    return <div>{errorWhileBuildRoute}</div>

  return (
    <div>
      <Trans>There was an issue while trying to confirm your price. Please try to swap again.</Trans>
    </div>
  )
}

type Props = {
  review: Pick<
    SwapReviewData,
    | 'parsedAmountIn'
    | 'outputChangePercent'
    | 'priceImpactFromBuild'
    | 'priceImpactResult'
    | 'showWarningStyle'
    | 'shouldDisableByPriceImpact'
    | 'isShowAcceptNewAmount'
    | 'honeypot'
    | 'showReservedOrderWarning'
    | 'reservedOrderLink'
  >
  slippage: number
  defaultSlp: number
  isAdvancedMode: boolean
  isDegenMode: boolean
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  hasAcceptedNewAmount: boolean
  onDismiss: () => void
  onSwap: () => void
  onUseDefaultSlippage: () => void
  onOpenSlippage: () => void
  onBuildErrorDismiss: () => void
  onAcceptNewAmount: () => void
}

const SwapReviewWarnings = ({
  review,
  slippage,
  defaultSlp,
  isAdvancedMode,
  isDegenMode,
  isBuildingRoute,
  errorWhileBuildRoute,
  hasAcceptedNewAmount,
  onDismiss,
  onSwap,
  onUseDefaultSlippage,
  onOpenSlippage,
  onBuildErrorDismiss,
  onAcceptNewAmount,
}: Props) => {
  const {
    parsedAmountIn,
    outputChangePercent,
    priceImpactFromBuild,
    priceImpactResult,
    showWarningStyle,
    shouldDisableByPriceImpact,
    isShowAcceptNewAmount,
    honeypot,
    showReservedOrderWarning,
    reservedOrderLink,
  } = review
  const shouldDisableConfirmButton = isBuildingRoute || !!errorWhileBuildRoute
  const isSlippageNotEnough = isSlippageBuildError(errorWhileBuildRoute)
  const disableSwap =
    (isShowAcceptNewAmount && !hasAcceptedNewAmount) || shouldDisableConfirmButton || shouldDisableByPriceImpact
  const disableAcceptNewAmount = hasAcceptedNewAmount || (priceImpactResult.isVeryHigh && !isDegenMode)
  return (
    <div className="flex flex-col gap-4">
      <SlippageWarningNote rawSlippage={slippage} />

      <PriceImpactNote isDegenMode={isAdvancedMode} priceImpact={priceImpactFromBuild} />

      {errorWhileBuildRoute && (
        <ErrorWarning
          type="warn"
          title={<BuildErrorMessage errorWhileBuildRoute={errorWhileBuildRoute} honeypot={honeypot} />}
        />
      )}
      {showReservedOrderWarning && (
        <ReservedOrderNotice symbol={parsedAmountIn?.currency.symbol} to={reservedOrderLink} />
      )}

      {errorWhileBuildRoute ? (
        isSlippageNotEnough && slippage <= defaultSlp ? (
          <div className="flex gap-4">
            <ButtonOutlined onClick={onDismiss} className="flex-1">
              Dismiss
            </ButtonOutlined>
            {slippage < defaultSlp ? (
              <ButtonPrimary className="flex-[2]" onClick={onUseDefaultSlippage}>
                Use Suggested Slippage
              </ButtonPrimary>
            ) : (
              <ButtonPrimary className="flex-1" onClick={onOpenSlippage}>
                Set Custom Slippage
              </ButtonPrimary>
            )}
          </div>
        ) : (
          <ButtonPrimary onClick={onBuildErrorDismiss}>
            <span className="text-sm font-medium leading-none">{honeypot?.isFOT ? 'Adjust Settings' : 'Dismiss'}</span>
          </ButtonPrimary>
        )
      ) : (
        <div className="flex w-full gap-2">
          {isShowAcceptNewAmount && (
            <ButtonError
              error={
                !disableAcceptNewAmount &&
                (showWarningStyle || outputChangePercent <= AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD)
              }
              warning
              onClick={onAcceptNewAmount}
              disabled={disableAcceptNewAmount}
            >
              Accept New Amount
            </ButtonError>
          )}

          <ButtonError
            error={!disableSwap && showWarningStyle}
            onClick={onSwap}
            disabled={disableSwap}
            id="confirm-swap-or-send"
            className="flex items-center gap-1"
          >
            {shouldDisableConfirmButton ? (
              <span className="text-sm font-medium leading-none">
                <Trans>Swap</Trans>
              </span>
            ) : disableSwap ? (
              <>
                {shouldDisableByPriceImpact && (
                  <MouseoverTooltip
                    text={
                      <Trans>
                        To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled for
                        this trade. If you still wish to continue, you can turn on Degen Mode from Settings.
                      </Trans>
                    }
                  >
                    <Info size={14} />
                  </MouseoverTooltip>
                )}
                <span>{shouldDisableByPriceImpact ? <Trans>Swap Disabled</Trans> : <Trans>Confirm Swap</Trans>}</span>
              </>
            ) : (
              <span className="text-sm font-medium leading-none">
                <Trans>Confirm Swap</Trans>
              </span>
            )}
          </ButtonError>
        </div>
      )}
    </div>
  )
}

export default SwapReviewWarnings
