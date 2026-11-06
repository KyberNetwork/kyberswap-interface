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

type ReservedOrderNoticeProps = {
  symbol: string | undefined
  limitOrdersTo?: string
  stopMarketsTo?: string
}

/** Points at whichever open orders hold a claim on the token being sold. */
const ReservedOrderNotice = ({ symbol, limitOrdersTo, stopMarketsTo }: ReservedOrderNoticeProps) => {
  const title =
    limitOrdersTo && stopMarketsTo ? (
      <Trans>
        <span className="text-text">Notice</span>: Some of your {symbol} is already reserved by open orders - review
        your <Link to={limitOrdersTo}>limit orders</Link> and <Link to={stopMarketsTo}>Stop Market orders</Link>.
      </Trans>
    ) : stopMarketsTo ? (
      <Trans>
        <span className="text-text">Notice</span>: Some of your {symbol} is already reserved by an open Stop Market
        Order - review it <Link to={stopMarketsTo}>here</Link>.
      </Trans>
    ) : limitOrdersTo ? (
      <Trans>
        <span className="text-text">Notice</span>: Some of your {symbol} is already reserved by an open Limit Order -
        review it <Link to={limitOrdersTo}>here</Link>.
      </Trans>
    ) : null
  return title && <ErrorWarning type="warn" title={title} />
}

const BuildErrorMessage = ({ buildError, honeypot }: { buildError: string; honeypot: SwapReviewData['honeypot'] }) => {
  if (!buildError) return
  if (buildError.toLowerCase().includes('permit')) {
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

  if (isSlippageBuildError(buildError)) {
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
    buildError.includes('Please use a different wallet to fill an order that you created via the KyberSwap Limit Order')
  )
    return <div>{buildError}</div>

  return (
    <div>
      <Trans>There was an issue while trying to confirm your price. Please try to swap again.</Trans>
    </div>
  )
}

type SwapReviewActionsProps = {
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
    | 'reservedStopMarketLink'
  >
  slippage: number
  defaultSlippage: number
  isAdvancedMode: boolean
  isDegenMode: boolean
  isBuildingRoute: boolean
  buildError: string | undefined
  hasAcceptedNewAmount: boolean
  onDismiss?: () => void
  onConfirm?: () => void
  onUseDefaultSlippage?: () => void
  onOpenSlippage?: () => void
  onDismissBuildError?: () => void
  onAcceptNewAmount?: () => void
}

const SwapReviewActions = ({
  review,
  slippage,
  defaultSlippage,
  isAdvancedMode,
  isDegenMode,
  isBuildingRoute,
  buildError,
  hasAcceptedNewAmount,
  onDismiss,
  onConfirm,
  onUseDefaultSlippage,
  onOpenSlippage,
  onDismissBuildError,
  onAcceptNewAmount,
}: SwapReviewActionsProps) => {
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
    reservedStopMarketLink,
  } = review
  const shouldDisableConfirmButton = isBuildingRoute || !!buildError
  const isSlippageNotEnough = isSlippageBuildError(buildError)
  const disableSwap =
    (isShowAcceptNewAmount && !hasAcceptedNewAmount) || shouldDisableConfirmButton || shouldDisableByPriceImpact
  const disableAcceptNewAmount = hasAcceptedNewAmount || (priceImpactResult.isVeryHigh && !isDegenMode)
  return (
    <div className="flex flex-col gap-4">
      <SlippageWarningNote rawSlippage={slippage} />

      <PriceImpactNote isDegenMode={isAdvancedMode} priceImpact={priceImpactFromBuild} />

      {buildError && (
        <ErrorWarning type="warn" title={<BuildErrorMessage buildError={buildError} honeypot={honeypot} />} />
      )}
      {showReservedOrderWarning && (
        <ReservedOrderNotice
          symbol={parsedAmountIn?.currency.symbol}
          limitOrdersTo={reservedOrderLink}
          stopMarketsTo={reservedStopMarketLink}
        />
      )}

      {buildError ? (
        isSlippageNotEnough && slippage <= defaultSlippage ? (
          <div className="flex gap-4">
            <ButtonOutlined onClick={onDismiss} className="flex-1">
              Dismiss
            </ButtonOutlined>
            {slippage < defaultSlippage ? (
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
          <ButtonPrimary onClick={onDismissBuildError}>
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
            onClick={onConfirm}
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

export default SwapReviewActions
