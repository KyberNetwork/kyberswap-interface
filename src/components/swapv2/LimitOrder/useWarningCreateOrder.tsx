import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { DeltaRateLimitOrder } from 'components/swapv2/LimitOrder/DeltaRate'
import { USD_THRESHOLD, WORSE_PRICE_DIFF_THRESHOLD } from 'components/swapv2/LimitOrder/const'
import { useActiveWeb3React } from 'hooks'

const HightLight = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.warning};
`
export default function useWarningCreateOrder({
  currencyIn,
  outputAmount,
  displayRate,
  deltaRate,
  estimateUSD,
}: {
  currencyIn: Currency | undefined
  outputAmount: string
  displayRate: string
  deltaRate: DeltaRateLimitOrder
  estimateUSD: number
}) {
  const { chainId } = useActiveWeb3React()
  const warningMessage = useMemo(() => {
    const messages = []

    if (currencyIn && displayRate && !deltaRate.profit && Number(deltaRate.rawPercent) <= WORSE_PRICE_DIFF_THRESHOLD) {
      // need to remove the minus out of the percent text
      const percentWithoutMinus = deltaRate.percent.slice(1)

      messages.push(
        <Text>
          <Trans>
            Your limit order price is <HightLight>{percentWithoutMinus}</HightLight> lower than the market. You will be
            selling your {currencyIn.symbol} exceedingly cheap.
          </Trans>
        </Text>,
      )
    }

    const threshold = USD_THRESHOLD[chainId]
    const showWarningThresHold = outputAmount && estimateUSD < threshold

    if (showWarningThresHold) {
      messages.push(
        <Text>
          <Trans>
            We suggest you increase the value of your limit order to at least <HightLight>${threshold}</HightLight>.
            This will increase the odds of your order being filled.
          </Trans>
        </Text>,
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
  ])
  return warningMessage
}
