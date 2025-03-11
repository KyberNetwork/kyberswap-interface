import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import { Label } from 'components/swapv2/LimitOrder/LimitOrderForm'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'

import { RateInfo } from './type'

export type DeltaRateLimitOrder = { rawPercent: number | undefined; percent: string; profit: boolean }

export function useGetDeltaRateLimitOrder({
  marketPrice,
  rateInfo,
}: {
  marketPrice: BaseTradeInfo | undefined
  rateInfo: RateInfo
}): DeltaRateLimitOrder {
  const { deltaText, percent } = useMemo(() => {
    try {
      if (marketPrice && rateInfo.rate && rateInfo.invertRate) {
        const { rate, invert, invertRate } = rateInfo
        const ourRate = Number(invert ? invertRate : rate)
        const marketRate = Number(invert ? marketPrice.invertRate : marketPrice.marketRate)
        let percent = ((ourRate - marketRate) / marketRate) * 100
        if (invert) percent = -percent
        const delta = Number(percent)
        const sign = delta > 0 ? '+' : ''
        const deltaText = `${Math.abs(delta) > 100 ? '>100' : `${sign}${delta.toFixed(2)}`}%`
        return { percent, deltaText }
      }
    } catch (error) {
      console.log(error)
    }
    return { percent: undefined, deltaText: '' }
  }, [marketPrice, rateInfo])

  const percentText = Math.abs(Number(percent)) > 0.009 ? deltaText : ''
  return {
    rawPercent: percent,
    percent: percentText,
    profit: Boolean(percent && Number(percent) > 0),
  }
}

const DeltaRate = ({
  marketPrice,
  rateInfo,
  symbol,
  invert,
}: {
  marketPrice: BaseTradeInfo | undefined
  rateInfo: RateInfo
  symbol: string
  invert: boolean
}) => {
  const theme = useTheme()

  const { percent, profit } = useGetDeltaRateLimitOrder({ marketPrice, rateInfo })
  const color = profit ? theme.apr : theme.warning
  const styledPercent = (
    <Text as="span" color={color} fontWeight="500">
      {percent}
    </Text>
  )
  return (
    <Label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      {invert ? <Trans>Buy {symbol} at rate</Trans> : <Trans>Sell {symbol} at rate</Trans>}
      {percent ? (
        <>
          <Text as="span" color={color}>
            &nbsp;{percent}
          </Text>
          <InfoHelper
            color={color}
            text={
              profit ? (
                <Trans>Your selected price is {styledPercent} better than the current market price.</Trans>
              ) : (
                <Trans>Your selected price is {styledPercent} worse than the current market price.</Trans>
              )
            }
          />
        </>
      ) : null}
    </Label>
  )
}
export default DeltaRate
