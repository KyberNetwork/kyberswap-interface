import React from 'react'
import { Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { AutoColumn } from 'components/Column'
import { Currency, CurrencyAmount } from '@vutien/sdk-core'
import { OutlineCard } from 'components/Card'
import Divider from 'components/Divider'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { Trans } from '@lingui/macro'
import { useTokensPrice } from 'state/application/hooks'

export default function ProAmmPooledTokens({
  liquidityValue0,
  liquidityValue1,
  layout = 0
}: {
  liquidityValue0: CurrencyAmount<Currency> | undefined
  liquidityValue1: CurrencyAmount<Currency> | undefined
  layout?: number
}) {
  const theme = useTheme()
  const usdPrices = useTokensPrice([liquidityValue0?.currency.wrapped, liquidityValue1?.currency.wrapped])
  const estimatedUsdCurrencyA =
    liquidityValue0 && usdPrices[0] ? parseFloat(liquidityValue0.toSignificant(6)) * usdPrices[0] : 0

  const estimatedUsdCurrencyB =
    liquidityValue1 && usdPrices[1] ? parseFloat(liquidityValue1.toSignificant(6)) * usdPrices[1] : 0
  const render =
    layout === 0 ? (
      <OutlineCard marginTop="1rem" padding="1rem">
        <AutoColumn gap="md">
          <Text fontSize="16px" fontWeight="500">
            Your Liquidity
          </Text>

          <Divider />
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>POOLED {liquidityValue0?.currency?.symbol}</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
              <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                {liquidityValue0?.currency.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>POOLED {liquidityValue1?.currency?.symbol}</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
              <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                {liquidityValue1?.currency.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
    ) : (
      <>
        <OutlineCard marginTop="1rem" padding="1rem">
          <AutoColumn gap="md">
            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                Your Liquidity Balance
              </Text>
              <Text fontSize={12} fontWeight="500">
                {estimatedUsdCurrencyA + estimatedUsdCurrencyB}$
              </Text>
            </RowBetween>
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                <Trans>Your Pooled {liquidityValue0?.currency?.symbol}</Trans>
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                  {liquidityValue0?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                <Trans>Your Pooled {liquidityValue1?.currency?.symbol}</Trans>
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                  {liquidityValue1?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
          </AutoColumn>
        </OutlineCard>
      </>
    )
  return render
}
