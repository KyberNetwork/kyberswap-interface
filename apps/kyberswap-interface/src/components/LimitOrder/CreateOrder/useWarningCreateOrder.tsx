import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { PropsWithChildren, useMemo } from 'react'

import { ReservedOrderNotice } from 'components/LimitOrder/components'
import { DeltaRateLimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { formatDisplayNumber } from 'utils/numbers'

const AprHighlight = ({ children }: PropsWithChildren) => <span className="font-medium text-apr">{children}</span>

const WarningHighlight = ({ children }: PropsWithChildren) => (
  <span className="font-medium text-warning">{children}</span>
)

export const WORSE_PRICE_DIFF_THRESHOLD = -5
export const BETTER_PRICE_DIFF_THRESHOLD = 30

type UseWarningCreateOrderProps = {
  currencyIn: Currency | undefined
  displayRate: string
  deltaRate: DeltaRateLimitOrder
  showReservedOrderNotice?: boolean
  wrapAmount?: CurrencyAmount<Currency>
}

export const useWarningCreateOrder = ({
  currencyIn,
  displayRate,
  deltaRate,
  showReservedOrderNotice,
  wrapAmount,
}: UseWarningCreateOrderProps) => {
  const warningMessage = useMemo(() => {
    const messages = []
    const rawPercent = Number(deltaRate.rawPercent)
    const hasPercent = Number.isFinite(rawPercent)
    const displayPercent = deltaRate.percent.replace(/^[+-]/, '')
    const formattedWrapAmount = wrapAmount
      ? formatDisplayNumber(wrapAmount.toExact(), { significantDigits: 6 })
      : undefined

    if (hasPercent && rawPercent >= BETTER_PRICE_DIFF_THRESHOLD)
      messages.push(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            Limit order price is <AprHighlight>{displayPercent}</AprHighlight> higher than the market. We just want to
            make sure this is correct.
          </Trans>
        </div>,
      )

    if (currencyIn && displayRate && hasPercent && rawPercent <= WORSE_PRICE_DIFF_THRESHOLD) {
      messages.push(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            Limit order price is <WarningHighlight>{displayPercent}</WarningHighlight> lower than the market. You will
            be selling your {currencyIn.symbol} exceedingly cheap.
          </Trans>
        </div>,
      )
    }

    if (showReservedOrderNotice) {
      const search = new URLSearchParams({
        tab: LimitOrderTab.MY_ORDER,
        orderTab: LimitOrderStatus.ACTIVE,
        search: currencyIn?.wrapped.address ?? '',
      }).toString()

      messages.push(<ReservedOrderNotice symbol={currencyIn?.symbol} to={`?${search}`} />)
    }

    if (wrapAmount && formattedWrapAmount) {
      messages.push(
        <div className="text-xs font-medium text-subText">
          <Trans>
            You need to wrap{' '}
            <WarningHighlight>
              {formattedWrapAmount} {wrapAmount.currency.symbol}
            </WarningHighlight>{' '}
            before creating this order
          </Trans>
        </div>,
      )
    }

    return messages
  }, [currencyIn, deltaRate.percent, deltaRate.rawPercent, displayRate, showReservedOrderNotice, wrapAmount])
  return warningMessage
}
