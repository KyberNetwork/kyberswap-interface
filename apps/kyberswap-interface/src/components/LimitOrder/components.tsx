import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import { LimitOrder, RateInfo } from 'components/LimitOrder/types'
import { formatRateLimitOrder, getLimitOrderDisplayTakerSymbol, removeTrailingZero } from 'components/LimitOrder/utils'
import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

const Label = ({ children, className, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={style} className={cn('text-sm font-medium text-subText', className)} {...rest}>
    {children}
  </div>
)

const SummaryRow = ({ label, content }: { label: ReactNode; content: ReactNode }) => (
  <HStack className="min-h-6 w-full items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
    <div className="text-sm text-subText">{label}</div>
    <HStack className="min-w-0 flex-1 justify-end text-right text-sm font-medium max-sm:justify-start max-sm:text-left">
      {content}
    </HStack>
  </HStack>
)

const formatRateValue = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '--'
  const numberValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numberValue)) return '--'
  return removeTrailingZero(numberValue.toPrecision(6))
}

type RateValueProps = {
  currencyIn?: Currency
  currencyOut?: Currency
  rateInfo?: RateInfo
  order?: LimitOrder
}

const RateValue = ({ currencyIn, currencyOut, rateInfo, order }: RateValueProps) => {
  const [showInverted, setShowInverted] = useState(false)

  let baseSymbol: string | undefined
  let quoteSymbol: string | undefined
  let rate: string | undefined
  let referenceRate: string | undefined

  if (order) {
    const takerSymbol = getLimitOrderDisplayTakerSymbol(order)

    baseSymbol = showInverted ? order.makerAssetSymbol : takerSymbol
    quoteSymbol = showInverted ? takerSymbol : order.makerAssetSymbol
    rate = formatRateLimitOrder(order, showInverted)
    referenceRate = formatRateLimitOrder(order, !showInverted)
  } else {
    const baseCurrency = showInverted ? currencyIn : currencyOut
    const quoteCurrency = showInverted ? currencyOut : currencyIn

    baseSymbol = baseCurrency?.symbol
    quoteSymbol = quoteCurrency?.symbol
    rate = showInverted ? rateInfo?.rate : rateInfo?.invertRate
    referenceRate = showInverted ? rateInfo?.invertRate : rateInfo?.rate
  }

  if (!baseSymbol || !quoteSymbol) return <span>--</span>

  const displayRate = order ? rate || '--' : formatRateValue(rate)
  const displayReferenceRate = order ? referenceRate || '--' : formatRateValue(referenceRate)

  return (
    <HStack
      as="button"
      type="button"
      className="min-w-0 max-w-full items-center justify-end gap-2 text-right transition hover:brightness-75 max-sm:justify-start"
      onClick={() => setShowInverted(value => !value)}
    >
      <span className="truncate">
        1 {baseSymbol} = {displayRate} {quoteSymbol}
      </span>
      <span className="shrink-0 text-subText">~{displayReferenceRate}</span>
      <Repeat size={14} className="shrink-0 text-subText" />
    </HStack>
  )
}

type OrderSummaryProps = {
  title?: ReactNode
  inputCurrency: ReactNode
  outputCurrency: ReactNode
  currencyIn?: Currency
  currencyOut?: Currency
  rateInfo?: RateInfo
  order?: LimitOrder
  expires?: ReactNode
  marketRate?: ReactNode
  className?: string
}

export const OrderSummary = ({
  title,
  inputCurrency,
  outputCurrency,
  currencyIn,
  currencyOut,
  rateInfo,
  order,
  expires,
  marketRate,
  className,
}: OrderSummaryProps) => {
  const rows = [
    { label: <Trans>I pay</Trans>, content: inputCurrency },
    { label: <Trans>and receive</Trans>, content: outputCurrency },
    {
      label: <Trans>when</Trans>,
      content: <RateValue currencyIn={currencyIn} currencyOut={currencyOut} rateInfo={rateInfo} order={order} />,
    },
    ...(expires ? [{ label: <Trans>before the order expires on</Trans>, content: expires }] : []),
  ]

  return (
    <Stack className={cn('gap-3', className)}>
      {title && <Label>{title}</Label>}
      <Stack className="gap-3 rounded-xl bg-buttonGray px-4 py-3">
        {rows.map((item, index) => (
          <SummaryRow key={index} label={item.label} content={item.content} />
        ))}
      </Stack>
      {marketRate && (
        <Stack className="gap-2 rounded-xl bg-buttonGray px-4 py-3">
          <SummaryRow label={<Trans>Market Price</Trans>} content={marketRate} />
        </Stack>
      )}
    </Stack>
  )
}

const formatAmountWithSymbol = (amount: string, symbol?: string, amountPrefix?: string) =>
  `${amountPrefix ?? ''}${amount} ${symbol ?? ''}`.trim()

enum AmountSign {
  Plus = '+',
  Minus = '-',
}

type ClippedTextProps = {
  children: ReactNode
  className?: string
  title?: string
}

export const ClippedText = ({ children, className, title }: ClippedTextProps) => (
  <div className="flex w-full min-w-0 justify-end">
    <span
      className={cn('block min-w-0 max-w-full overflow-hidden whitespace-nowrap text-left', className)}
      title={title}
    >
      {children}
    </span>
  </div>
)

type AmountWithSymbolProps = {
  amount?: string
  currency?: Currency
  symbol?: string
  reverse?: boolean
  muted?: boolean
}

export const AmountWithSymbol = ({ amount, currency, symbol, reverse, muted }: AmountWithSymbolProps) => {
  const displaySymbol = symbol ?? currency?.wrapped.symbol
  const amountPrefix = reverse === undefined ? undefined : reverse ? AmountSign.Minus : AmountSign.Plus

  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-center justify-end gap-1 text-right text-sm font-medium',
        muted ? 'text-subText' : 'text-text',
      )}
      title={amount ? formatAmountWithSymbol(amount, displaySymbol, amountPrefix) : undefined}
    >
      {amount ? (
        <>
          {currency && (
            <span className="hidden shrink-0 max-sm:flex">
              <CurrencyLogo currency={currency} size="16px" />
            </span>
          )}
          <span className="min-w-0 overflow-hidden whitespace-nowrap text-left">
            {amountPrefix}
            {amount}
          </span>
          {displaySymbol && <span className="shrink-0 whitespace-nowrap">{displaySymbol}</span>}
        </>
      ) : (
        '--'
      )}
    </div>
  )
}

type SizeInfoProps = {
  amount: string
  currency?: Currency
  reverse?: boolean
  filledPercentText: string
  filledProgressPercent: number
}

export const SizeInfo = ({ amount, currency, reverse, filledPercentText, filledProgressPercent }: SizeInfoProps) => {
  const symbol = currency?.wrapped.symbol
  const amountPrefix = reverse === undefined ? undefined : reverse ? AmountSign.Plus : AmountSign.Minus

  return (
    <div
      className={cn(
        'grid w-full min-w-0 items-start gap-x-2 text-left',
        currency ? 'grid-cols-[16px_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
      )}
    >
      {currency && (
        <span className="row-span-2 flex size-4 self-center">
          <CurrencyLogo currency={currency} size="16px" />
        </span>
      )}
      <div
        className="flex min-w-0 items-center justify-start gap-1.5 text-left text-sm font-medium text-text"
        title={formatAmountWithSymbol(amount, symbol, amountPrefix)}
      >
        <span className="min-w-0 overflow-hidden whitespace-nowrap text-left">
          {amountPrefix}
          {amount}
        </span>
        {symbol && <span className="shrink-0 whitespace-nowrap">{symbol}</span>}
      </div>
      <div className="flex min-w-0 items-center justify-start gap-1.5 text-xs text-subText">
        <span className="min-w-12 whitespace-nowrap text-left">
          <Trans>Fill</Trans> {filledPercentText}%
        </span>
        <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-subText-40 max-sm:hidden">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.min(filledProgressPercent, 100)}%` }}
          />
        </span>
      </div>
    </div>
  )
}
