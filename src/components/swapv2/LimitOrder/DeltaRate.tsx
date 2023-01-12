import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import { Label } from 'components/swapv2/LimitOrder/LimitOrderForm'
import useTheme from 'hooks/useTheme'

import { RateInfo } from './type'

export function useGetDeltaRateLimitOrder({
  marketPrice,
  rateInfo,
}: {
  marketPrice: Price<Currency, Currency> | undefined
  rateInfo: RateInfo
}) {
  let percent: number | string = '',
    deltaText = ''
  try {
    if (marketPrice && rateInfo.rate && rateInfo.invertRate) {
      const { rate, invert, invertRate } = rateInfo
      const ourRate = Number(invert ? invertRate : rate)
      const marketRate = Number(invert ? marketPrice.invert().toFixed(10) : marketPrice.toFixed(10))
      percent = ((ourRate - marketRate) / marketRate) * 100
      if (invert) percent = -percent
      const delta = Number(percent)
      const sign = delta > 0 ? '+' : ''
      deltaText = `${Math.abs(delta) > 100 ? '>100' : `${sign}${delta.toFixed(2)}`}%`
    }
  } catch (error) {
    console.log(error)
  }

  const percentText = Math.abs(Number(percent)) > 0.009 ? deltaText : ''
  return {
    percent: percentText,
    profit: percentText && Number(percent) > 0,
  }
}

const DeltaRate = ({
  marketPrice,
  rateInfo,
  symbolIn,
}: {
  marketPrice: Price<Currency, Currency> | undefined
  rateInfo: RateInfo
  symbolIn: string
}) => {
  const theme = useTheme()

  const { percent, profit } = useGetDeltaRateLimitOrder({ marketPrice, rateInfo })
  const color = profit ? theme.apr : theme.red

  return (
    <Label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      <Trans>Sell {symbolIn} at rate</Trans>
      {percent ? (
        <>
          <Text as="span" color={color}>
            &nbsp;{percent}
          </Text>
          <InfoHelper
            color={color}
            text={t`Your selected price is ${percent} ${profit ? t`above` : t`below`} the current market price.`}
          />
        </>
      ) : null}
    </Label>
  )
}
export default DeltaRate
