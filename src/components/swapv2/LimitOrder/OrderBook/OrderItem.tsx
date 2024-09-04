import { Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { LimitOrderFromTokenPairFormatted } from '../type'

export const ItemWrapper = styled.div`
  font-size: 14px;
  line-height: 20px;
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 2fr 1fr;
  padding: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1.2fr 1.8fr 2fr 1.8fr;
  `}
`

export const ChainImage = styled.img`
  height: 16px;
  width: 16px;
  position: relative;
  top: 2px;
  left: 10px;
`

const Rate = styled.div<{ reverse?: boolean }>`
  color: ${({ theme, reverse }) => (reverse ? theme.primary : theme.red)};
`

const AmountInfo = ({
  plus,
  amount,
  currency,
  upToExtraSmall,
}: {
  plus?: boolean
  amount: string
  currency?: Currency
  upToExtraSmall?: boolean
}) => (
  <Flex alignItems={'center'}>
    <CurrencyLogo currency={currency} size="17px" style={{ marginRight: upToExtraSmall ? 4 : 8 }} />
    <span>{plus ? '+' : '-'}</span>
    <span>{amount}</span>
  </Flex>
)

export default function OrderItem({
  reverse,
  order,
  style,
}: {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  style: CSSProperties
}) {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()
  const { supportedChains } = useChainsConfig()

  const chain = useMemo(
    () => supportedChains.find(chain => chain.chainId === order.chainId),
    [order.chainId, supportedChains],
  )

  return (
    <ItemWrapper style={style}>
      <ChainImage src={chain?.icon} alt="Network" />
      <Rate reverse={reverse}>{order.rate}</Rate>
      <AmountInfo
        plus={reverse}
        amount={order[!reverse ? 'makerAmount' : 'takerAmount']}
        currency={makerCurrency}
        upToExtraSmall={upToExtraSmall}
      />
      <AmountInfo
        plus={!reverse}
        amount={order[!reverse ? 'takerAmount' : 'makerAmount']}
        currency={takerCurrency}
        upToExtraSmall={upToExtraSmall}
      />
      {!upToExtraSmall && <Text color={theme.subText}>Filled {order.filled}%</Text>}
    </ItemWrapper>
  )
}
