import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { PropsWithChildren, ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { DeltaRateLimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { formatDisplayNumber } from 'utils/numbers'

const AprHighlight = ({ children }: PropsWithChildren) => <span className="font-medium text-apr">{children}</span>

const WarningHighlight = ({ children }: PropsWithChildren) => (
  <span className="font-medium text-warning">{children}</span>
)

const ReservedBalanceWarning = ({ tokenIn, tokenOut, to }: { tokenIn?: string; tokenOut?: string; to: string }) => (
  <span className="text-xs font-medium italic text-subText">
    <Trans>
      Your {tokenIn} balance is fully used by existing {tokenIn}/{tokenOut} orders. Cancel or reduce an order to free up
      balance. <Link to={to}>Review orders</Link>
    </Trans>
  </span>
)

export const WORSE_PRICE_DIFF_THRESHOLD = -5
export const BETTER_PRICE_DIFF_THRESHOLD = 30

type UseWarningCreateOrderProps = {
  currencyIn?: Currency
  currencyOut?: Currency
  deltaRate: DeltaRateLimitOrder
  showReservedOrderNotice?: boolean
  wrapAmount?: CurrencyAmount<Currency>
}

export const useWarningCreateOrder = ({
  currencyIn,
  currencyOut,
  deltaRate,
  showReservedOrderNotice,
  wrapAmount,
}: UseWarningCreateOrderProps) => {
  const warning = useMemo(() => {
    const formWarnings: ReactNode[] = []
    const confirmWarnings: ReactNode[] = []
    let shouldWarnReview = false
    let shouldDisableReview = false
    const rawPercent = Number(deltaRate.rawPercent)
    const hasPercent = Number.isFinite(rawPercent)
    const displayPercent = deltaRate.percent.replace(/^[+-]/, '')

    const addWarning = (warning: ReactNode, options?: { hideOnForm?: boolean }) => {
      confirmWarnings.push(warning)
      if (!options?.hideOnForm) formWarnings.push(warning)
    }

    if (hasPercent && rawPercent >= BETTER_PRICE_DIFF_THRESHOLD) {
      addWarning(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            Limit order price is <AprHighlight>{displayPercent}</AprHighlight> higher than the market. We just want to
            make sure this is correct.
          </Trans>
        </div>,
      )
    }

    if (hasPercent && rawPercent <= WORSE_PRICE_DIFF_THRESHOLD && rawPercent > -100) {
      shouldWarnReview = true
      addWarning(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            Limit order price is <WarningHighlight>{displayPercent}</WarningHighlight> lower than the market. You will
            be selling your {currencyIn?.symbol} exceedingly cheap.
          </Trans>
        </div>,
      )
    }

    if (showReservedOrderNotice) {
      shouldDisableReview = true
      const search = new URLSearchParams({
        tab: LimitOrderTab.MY_ORDER,
        orderTab: LimitOrderStatus.ACTIVE,
        search: currencyIn?.wrapped.symbol ?? '',
      }).toString()

      formWarnings.push(
        <ReservedBalanceWarning
          tokenIn={currencyIn?.wrapped.symbol}
          tokenOut={currencyOut?.wrapped.symbol}
          to={`?${search}`}
        />,
      )
    }

    if (wrapAmount) {
      const formattedWrapAmount = formatDisplayNumber(wrapAmount.toExact(), { significantDigits: 6 })
      addWarning(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            You need to wrap{' '}
            <AprHighlight>
              {formattedWrapAmount} {wrapAmount.currency.symbol}
            </AprHighlight>{' '}
            before creating this order
          </Trans>
        </div>,
        { hideOnForm: true },
      )
    }

    return {
      shouldWarnReview,
      shouldDisableReview,
      formWarnings,
      confirmWarnings,
    }
  }, [currencyIn, currencyOut, deltaRate.percent, deltaRate.rawPercent, showReservedOrderNotice, wrapAmount])
  return warning
}
