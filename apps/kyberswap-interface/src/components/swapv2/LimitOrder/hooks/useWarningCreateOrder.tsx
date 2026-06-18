import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo } from 'react'

import { WORSE_PRICE_DIFF_THRESHOLD } from 'components/swapv2/LimitOrder/helpers'
import { DeltaRateLimitOrder } from 'components/swapv2/LimitOrder/types'
import { formatDisplayNumber } from 'utils/numbers'

const HightLight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-warning">{children}</span>
)

const BETTER_PRICE_DIFF_THRESHOLD = 30

export const useWarningCreateOrder = ({
  currencyIn,
  displayRate,
  deltaRate,
  missingAllowance,
}: {
  currencyIn: Currency | undefined
  displayRate: string
  deltaRate: DeltaRateLimitOrder
  missingAllowance: boolean | CurrencyAmount<Currency>
}) => {
  const warningMessage = useMemo(() => {
    const messages = []
    if (Number(deltaRate.rawPercent) >= BETTER_PRICE_DIFF_THRESHOLD)
      messages.push(
        <div>
          <Trans>
            Limit order price is &gt;={BETTER_PRICE_DIFF_THRESHOLD}% higher than the market. We just want to make sure
            this is correct
          </Trans>
        </div>,
      )

    if (currencyIn && displayRate && !deltaRate.profit && Number(deltaRate.rawPercent) <= WORSE_PRICE_DIFF_THRESHOLD) {
      const percentWithoutMinus = deltaRate.percent.slice(1)

      messages.push(
        <div>
          <Trans>
            Your limit order price is <HightLight>{percentWithoutMinus}</HightLight> lower than the market. You will be
            selling your {currencyIn.symbol} exceedingly cheap.
          </Trans>
        </div>,
      )
    }

    if (missingAllowance && typeof missingAllowance !== 'boolean') {
      messages.push(
        <div>
          <Trans>
            Your current allowance is insufficient. Approve an additional{' '}
            {formatDisplayNumber(missingAllowance.toExact(), { significantDigits: 6 })} {currencyIn?.symbol} to proceed.
          </Trans>
        </div>,
      )
    }

    return messages
  }, [currencyIn, deltaRate.percent, deltaRate.profit, deltaRate.rawPercent, displayRate, missingAllowance])
  return warningMessage
}
