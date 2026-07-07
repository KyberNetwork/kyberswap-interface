import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { ClippedText } from 'components/LimitOrder/components'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { formatRatePercentText } from 'components/LimitOrder/utils'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'

const formatAmountWithSymbol = (amount: string, symbol?: string, amountPrefix?: string) =>
  `${amountPrefix ?? ''}${amount} ${symbol ?? ''}`.trim()

enum AmountSign {
  Plus = '+',
  Minus = '-',
}

type RateCellProps = {
  order: LimitOrderFromTokenPairFormatted
  className?: string
  showInvertedRate?: boolean
}

const RateCell = ({ order, className, showInvertedRate }: RateCellProps) => {
  const formattedRate = showInvertedRate ? order.formattedInvertedRate : order.formattedRate
  const formattedMarketDiffPercent = showInvertedRate
    ? order.formattedInvertedMarketDiffPercent
    : order.formattedMarketDiffPercent

  return (
    <div className="flex w-full min-w-0 flex-col items-end gap-1 text-right">
      <ClippedText className={cn('text-sm font-medium', className)} title={formattedRate}>
        {formattedRate}
      </ClippedText>
      {formattedMarketDiffPercent && (
        <div className="whitespace-nowrap text-xs text-subText">
          {formatRatePercentText(formattedMarketDiffPercent)}
        </div>
      )}
    </div>
  )
}

type AmountTextProps = {
  amount?: string
  currency?: Currency
  amountPrefix?: AmountSign
  symbol?: string
}

const AmountText = ({ amount, currency, amountPrefix, symbol }: AmountTextProps) => {
  const displaySymbol = symbol ?? currency?.wrapped.symbol

  return (
    <div
      className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-sm font-medium text-text"
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

type SizeCellProps = {
  amount: string
  currency?: Currency
  filledPercentText: string
  filledProgressPercent: number
}

const SizeCell = ({ amount, currency, filledPercentText, filledProgressPercent }: SizeCellProps) => {
  const symbol = currency?.wrapped.symbol

  return (
    <div
      className={cn(
        'grid w-full min-w-0 items-start gap-x-2 gap-y-1 text-left',
        currency ? 'grid-cols-[16px_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
      )}
    >
      {currency && (
        <span className="row-span-2 flex size-4 self-center">
          <CurrencyLogo currency={currency.wrapped} size="16px" />
        </span>
      )}
      <div
        className="flex min-w-0 items-center justify-start gap-1 text-left text-sm font-medium text-text"
        title={formatAmountWithSymbol(amount, symbol, AmountSign.Minus)}
      >
        <span className="min-w-0 overflow-hidden whitespace-nowrap text-left">
          {AmountSign.Minus}
          {amount}
        </span>
        {symbol && <span className="shrink-0 whitespace-nowrap">{symbol}</span>}
      </div>
      <div className="flex min-w-0 items-center justify-start gap-1 text-xs text-subText">
        <span className="min-w-12 whitespace-nowrap text-left">
          <Trans>Fill</Trans> {filledPercentText}%
        </span>
        <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-subText-40">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.min(filledProgressPercent, 100)}%` }}
          />
        </span>
      </div>
    </div>
  )
}

const AvailableCell = ({ amount, symbol }: { amount?: string; symbol?: string }) => (
  <div className="min-w-0 max-sm:col-start-3 max-sm:row-start-2">
    <AmountText amount={amount} symbol={symbol} />
  </div>
)

const TotalCell = ({ amount, currency }: { amount?: string; currency?: Currency }) => (
  <div className="min-w-0 max-sm:col-start-2 max-sm:row-start-2 [&>div]:max-sm:justify-start [&>div]:max-sm:text-left">
    <AmountText amount={amount} currency={currency} amountPrefix={AmountSign.Plus} />
  </div>
)

type OrderRowProps = {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  onTake?: (order: LimitOrderFromTokenPairFormatted) => void
  showInvertedRate?: boolean
}

const OrderRow = ({ reverse = false, order, onTake, showInvertedRate }: OrderRowProps) => {
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()

  const chain = NETWORKS_INFO[order.chainId]
  const filledPercent = Math.max(0, Math.min(Number(order.filledPercent) || 0, 100))
  const sizeAmount = order.formattedMakerAmount
  const availableAmount = order.formattedAvailableMakerAmount
  const totalAmount = order.formattedTakerAmount
  const sizeCurrency = !reverse ? makerCurrency : takerCurrency
  const totalCurrency = !reverse ? takerCurrency : makerCurrency

  return (
    <RowWrapper className="min-h-14 px-4 py-2 max-sm:min-h-[84px] max-sm:grid-rows-[40px_24px]">
      <span className="flex items-center justify-center max-sm:row-start-1">
        <img className="size-5" src={chain?.icon} alt="Network" />
      </span>
      <SizeCell
        amount={sizeAmount}
        currency={sizeCurrency}
        filledPercentText={filledPercent.toString()}
        filledProgressPercent={filledPercent}
      />
      <AvailableCell amount={availableAmount} symbol={sizeCurrency?.wrapped.symbol} />
      <div className="min-w-0 max-sm:col-start-3 max-sm:row-start-1">
        <RateCell order={order} className={reverse ? 'text-primary' : 'text-red'} showInvertedRate={showInvertedRate} />
      </div>
      <TotalCell amount={totalAmount} currency={totalCurrency} />
      <span className="justify-self-end max-sm:hidden">
        <CopyHelper toCopy={String(order.id)} margin="0" size={16} className="justify-self-end text-subText" />
      </span>
      <div className="justify-self-end max-sm:col-start-1 max-sm:row-start-2 max-sm:justify-self-center">
        {order.hasAvailable && (
          <button
            type="button"
            onClick={() => onTake?.(order)}
            className="rounded-full bg-primary-20 px-4 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-30 max-sm:px-2 max-sm:py-0.5 max-sm:text-xs"
          >
            <Trans>Take</Trans>
          </button>
        )}
      </div>
    </RowWrapper>
  )
}

export default OrderRow
