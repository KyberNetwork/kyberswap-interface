import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'

import { Label } from '.'

const DeltaRate = ({
  symbol,
  rate,
  marketPrice,
}: {
  symbol: string
  rate: string
  marketPrice: Price<Currency, Currency> | undefined
}) => {
  const theme = useTheme()
  let percent: number | string = ''
  try {
    percent = marketPrice && rate ? (Number(rate) / Number(marketPrice.toFixed(10))) * 100 : ''
  } catch (error) {
    console.log(error)
  }

  const delta = Number(percent) - 100
  const deltaText = `${delta > 0 ? '+' : ''}${delta.toFixed(5)}%`
  const color = delta > 0 ? theme.apr : theme.red

  return (
    <Label style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
      <Trans>
        {symbol} Price &nbsp;
        {Math.abs(delta) > 0.0005 && percent ? (
          <Flex alignItems={'center'} color={color}>
            <Text>({deltaText} </Text>
            <InfoHelper
              color={color}
              text={t`Your selected price is ${deltaText} ${delta > 0 ? `above` : `below`} the current market price.`}
            />
            )
          </Flex>
        ) : null}
      </Trans>
    </Label>
  )
}
export default DeltaRate
