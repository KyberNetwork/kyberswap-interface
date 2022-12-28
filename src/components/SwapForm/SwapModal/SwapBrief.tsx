import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import React from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { TruncatedText } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'

type Props = {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
}

const SwapBrief: React.FC<Props> = ({ inputAmount, outputAmount }) => {
  const theme = useTheme()
  const { typedValue, feeConfig } = useSwapFormContext()
  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo currency={inputAmount.currency} size={'24px'} style={{ marginRight: '12px' }} />
          <TruncatedText fontSize={24} fontWeight={500}>
            {!!feeConfig ? typedValue : inputAmount.toSignificant(6)}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {inputAmount.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowFixed>
        <ArrowDown size="16" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
      </RowFixed>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo currency={outputAmount?.currency} size={'24px'} style={{ marginRight: '12px' }} />
          <TruncatedText fontSize={24} fontWeight={500}>
            {outputAmount.toSignificant(6) || ''}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {outputAmount.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
    </AutoColumn>
  )
}

export default SwapBrief
