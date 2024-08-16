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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1.2fr 1.8fr 2fr 1fr;
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
  upToSmall,
}: {
  plus?: boolean
  amount: string
  currency?: Currency
  upToSmall?: boolean
}) => (
  <Flex alignItems={'center'}>
    <CurrencyLogo currency={currency} size="17px" style={{ marginRight: upToSmall ? 4 : 8 }} />
    <span>{plus ? '+' : '-'}</span>
    <span>{amount}</span>
  </Flex>
)

export default function OrderItem({
  reverse,
  order,
  style,
  showAmountOut,
}: {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  style: CSSProperties
  showAmountOut: boolean
}) {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { currencyIn, currencyOut } = useLimitState()
  const { supportedChains } = useChainsConfig()

  const chain = useMemo(
    () => supportedChains.find(chain => chain.chainId === order.chainId),
    [order.chainId, supportedChains],
  )

  return (
    <ItemWrapper style={style}>
      <ChainImage src={chain?.icon} alt="Network" />
      <Rate reverse={reverse}>{order.rate}</Rate>
      {!upToSmall ? (
        <>
          <AmountInfo plus={reverse} amount={order.firstAmount} currency={currencyIn} upToSmall={upToSmall} />
          <AmountInfo plus={!reverse} amount={order.secondAmount} currency={currencyOut} upToSmall={upToSmall} />
        </>
      ) : (
        <AmountInfo
          plus={showAmountOut ? !reverse : reverse}
          amount={showAmountOut ? order.secondAmount : order.firstAmount}
          currency={showAmountOut ? currencyOut : currencyIn}
          upToSmall={upToSmall}
        />
      )}
      <Text color={theme.subText}>
        {!upToSmall && 'Filled '}
        {order.filled}%
      </Text>
    </ItemWrapper>
  )
}
