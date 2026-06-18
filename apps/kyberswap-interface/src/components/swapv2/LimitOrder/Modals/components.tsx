import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'

import Column from 'components/Column'
import { Swap as SwapIcon } from 'components/Icons'
import TradePrice from 'components/swapv2/LimitOrder/Form/TradePrice'
import { formatAmountOrder, formatRateLimitOrder } from 'components/swapv2/LimitOrder/helpers'
import { LimitOrder, RateInfo } from 'components/swapv2/LimitOrder/types'
import { NativeCurrencies } from 'constants/tokens'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { cn } from 'utils/cn'

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex w-full flex-col gap-6 px-6 py-5 max-md:px-5 max-md:py-4 max-md:text-sm', className)}
    {...rest}
  >
    {children}
  </div>
)

export const Value = ({ children, className, style, onClick, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    onClick={onClick}
    style={style}
    className={cn('flex items-center gap-[5px] text-right text-sm font-medium text-text', className)}
    {...rest}
  >
    {children}
  </div>
)

const Row = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-center justify-between leading-5', className)} {...rest}>
    {children}
  </div>
)

export const Label = ({ children, className, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={style} className={cn('text-sm font-medium text-subText', className)} {...rest}>
    {children}
  </div>
)

export const Header = ({ title, onDismiss }: { title: string; onDismiss: () => void }) => {
  return (
    <div className="flex justify-between">
      <div className="flex items-center gap-2 text-text">
        <span className="text-xl">{title}</span>
      </div>
      <X onClick={onDismiss} style={{ cursor: 'pointer' }} className="text-subText" />
    </div>
  )
}

export const Note = ({ note }: { note?: string }) =>
  note ? <div className="rounded-2xl bg-subText-20 px-3 py-2.5 text-xs leading-4 text-text">{note}</div> : null

type ListDataType = { label: string; content: ReactNode }[]

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
    <Column className="gap-2">
      {title && <Label className="mb-1">{title}</Label>}
      <div className="flex flex-col gap-3 rounded-xl bg-buttonBlack/30 p-4">
        {listData.map(item => (
          <Row key={item.label}>
            <Label>{item.label}</Label>
            {item.content}
          </Row>
        ))}
      </div>
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
  return (
    <div className="flex flex-col">
      <Row>
        <Label className="text-xs">
          <Trans>Est. Market Price</Trans>
        </Label>
        <Value style={{ maxWidth: '60%' }}>
          <TradePrice
            price={marketPrice}
            loading={false}
            className="!text-text"
            symbolIn={symbolIn}
            symbolOut={symbolOut}
          />
        </Value>
      </Row>
    </div>
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

    const native = NativeCurrencies[order.chainId]
    const isNative = order.nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()

    symbolIn = isNative ? native?.symbol || takerAssetSymbol : takerAssetSymbol
    symbolOut = makerAssetSymbol
    rateStr = formatRateLimitOrder(order, invertRate)
  } else {
    if (!currencyIn || !currencyOut || !rateInfo) return null
    symbolIn = currencyIn?.symbol
    symbolOut = currencyOut?.symbol
    rateStr = formatAmountOrder(invertRate ? rateInfo.invertRate : rateInfo.rate)
  }
  return (
    <Value className="max-w-[290px] cursor-pointer" onClick={() => setInvertRate(!invertRate)}>
      <span>
        <Trans>
          {invertRate ? symbolOut : symbolIn} price of {rateStr} {invertRate ? symbolIn : symbolOut}
        </Trans>
      </span>
      <SwapIcon rotate={90} size={19} />
    </Value>
  )
}
