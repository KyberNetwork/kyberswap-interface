import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import { Swap as SwapIcon } from 'components/Icons'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'

import { formatAmountOrder, formatRateLimitOrder } from '../helpers'
import { LimitOrder, RateInfo } from '../type'

export const Container = styled.div`
  padding: 20px 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size:14px;
    padding: 16px 20px;
  `};
`

export const Value = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  display: flex;
  gap: 5px;
  align-items: center;
  text-align: right;
  font-size: 14px;
`
const Row = styled.div`
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

export const Label = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
  font-size: 14px;
`

export const Header = ({ title, onDismiss }: { title: string; onDismiss: () => void }) => {
  const theme = useTheme()
  return (
    <Flex justifyContent={'space-between'}>
      <Flex color={theme.text} alignItems="center" style={{ gap: 8 }}>
        <Text fontSize={20}>{title}</Text>
      </Flex>
      <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.subText} />
    </Flex>
  )
}

const NoteWrapper = styled.div`
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.text};
  padding: 10px 12px;
  border-radius: 16px;
  line-height: 16px;
  font-size: 12px;
`
export const Note = ({ note }: { note?: string }) => {
  return note ? <NoteWrapper>{note}</NoteWrapper> : null
}

type ListDataType = { label: string; content: ReactNode }[]
const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.3)};
  padding: 16px;
`
export function ListInfo({
  title,
  listData,
  marketPrice,
  symbolIn,
  symbolOut,
}: {
  title?: string
  listData: ListDataType
  marketPrice: BaseTradeInfo | undefined
  symbolIn: string | undefined
  symbolOut: string | undefined
}) {
  return (
    <Column gap="8px">
      {title && <Label style={{ marginBottom: '4px' }}>{title}</Label>}
      <ListWrapper>
        {listData.map(item => (
          <Row key={item.label}>
            <Label>{item.label}</Label>
            {item.content}
          </Row>
        ))}
      </ListWrapper>
      <MarketInfo marketPrice={marketPrice} symbolIn={symbolIn} symbolOut={symbolOut} />
    </Column>
  )
}
const MarketInfo = ({
  marketPrice,
  symbolIn,
  symbolOut,
}: {
  marketPrice: BaseTradeInfo | undefined
  symbolIn: string | undefined
  symbolOut: string | undefined
}) => {
  const theme = useTheme()
  return (
    <Flex flexDirection={'column'}>
      <Row>
        <Label style={{ fontSize: 12 }}>
          <Trans>Est. Market Price</Trans>
        </Label>
        <Value style={{ maxWidth: '60%' }}>
          <TradePrice
            price={marketPrice}
            loading={false}
            style={{ color: theme.text }}
            symbolIn={symbolIn}
            symbolOut={symbolOut}
          />
        </Value>
      </Row>
    </Flex>
  )
}
export const Rate = ({
  currencyIn,
  currencyOut,
  rateInfo,
  order,
}: {
  currencyIn?: Currency | undefined
  currencyOut?: Currency | undefined
  rateInfo?: RateInfo
  order?: LimitOrder
}) => {
  const [invertRate, setInvertRate] = useState(false)
  let symbolIn, symbolOut, rateStr
  if (order) {
    const { makerAssetSymbol, takerAssetSymbol } = order
    symbolIn = takerAssetSymbol
    symbolOut = makerAssetSymbol
    rateStr = formatRateLimitOrder(order, invertRate)
  } else {
    if (!currencyIn || !currencyOut || !rateInfo) return null
    symbolIn = currencyIn?.symbol
    symbolOut = currencyOut?.symbol
    rateStr = formatAmountOrder(invertRate ? rateInfo.invertRate : rateInfo.rate)
  }
  return (
    <Value
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', maxWidth: 290 }}
      onClick={() => setInvertRate(!invertRate)}
    >
      <Text>
        <Trans>
          {invertRate ? symbolOut : symbolIn} price of {rateStr} {invertRate ? symbolIn : symbolOut}
        </Trans>
      </Text>
      <SwapIcon rotate={90} size={19} />
    </Value>
  )
}
