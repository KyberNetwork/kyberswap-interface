import { Currency } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import useTheme from 'hooks/useTheme'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { LimitOrderFromTokenPairFormatted } from '../type'

export const ItemWrapper = styled.div`
  font-size: 14px;
  line-height: 20px;
  display: grid;
  grid-template-columns: 2fr 2fr 2fr 1fr;
  padding: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1.6fr 2fr 2fr 1fr;
  `}
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
  <Text>
    <Flex alignItems={'center'}>
      <CurrencyLogo currency={currency} size="17px" style={{ marginRight: upToSmall ? 4 : 8 }} />
      <span>{plus ? '+' : '-'}</span>
      <span>{amount}</span>
    </Flex>
  </Text>
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
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { currencyIn, currencyOut } = useLimitState()

  return (
    <ItemWrapper style={style}>
      <Rate reverse={reverse}>{order.rate}</Rate>
      <AmountInfo plus={reverse} amount={order.firstAmount} currency={currencyIn} upToSmall={upToSmall} />
      <AmountInfo plus={!reverse} amount={order.secondAmount} currency={currencyOut} upToSmall={upToSmall} />
      <Text style={{ color: rgba(theme.white, 0.6) }}>
        {!upToSmall && 'Filled '}
        {order.filled}%
      </Text>
    </ItemWrapper>
  )
}
