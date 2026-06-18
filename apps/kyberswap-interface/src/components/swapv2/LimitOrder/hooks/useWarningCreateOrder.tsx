import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo } from 'react'

import { DeltaRateLimitOrder } from 'components/swapv2/LimitOrder/Form/LimitOrderRateSection'
import {
  BETTER_PRICE_DIFF_THRESHOLD,
  USD_THRESHOLD,
  WORSE_PRICE_DIFF_THRESHOLD,
} from 'components/swapv2/LimitOrder/const'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'

const HightLight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-warning">{children}</span>
)

export default function useWarningCreateOrder({
  currencyIn,
  outputAmount,
  displayRate,
  deltaRate,
  estimateUSD,
  missingAllowance,
}: {
  currencyIn: Currency | undefined
  outputAmount: string
  displayRate: string
  deltaRate: DeltaRateLimitOrder
  estimateUSD: number
  missingAllowance: boolean | CurrencyAmount<Currency>
}) {
  const { chainId } = useActiveWeb3React()
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

    const threshold = USD_THRESHOLD[chainId]
    const showWarningThresHold = outputAmount && estimateUSD < threshold

    if (showWarningThresHold) {
      messages.push(
        <div>
          <Trans>
            We suggest you increase the value of your limit order to at least <HightLight>${threshold}</HightLight>.
            This will increase the odds of your order being filled.
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
  }, [
    chainId,
    currencyIn,
    deltaRate.percent,
    deltaRate.profit,
    deltaRate.rawPercent,
    displayRate,
    estimateUSD,
    outputAmount,
    missingAllowance,
  ])
  return warningMessage
}
