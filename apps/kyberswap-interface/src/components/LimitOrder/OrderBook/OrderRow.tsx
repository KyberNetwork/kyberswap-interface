import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { formatRatePercentText } from 'components/LimitOrder/utils'
import { HStack, Stack } from 'components/Stack'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'

const formatAmountWithSymbol = (amount: string, symbol?: string, amountPrefix?: string) =>
  `${amountPrefix ?? ''}${amount} ${symbol ?? ''}`.trim()

enum AmountSign {
  Plus = '+',
  Minus = '-',
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
      className="flex w-full min-w-0 items-center justify-start gap-1 text-sm font-medium text-text"
      title={amount ? formatAmountWithSymbol(amount, displaySymbol, amountPrefix) : undefined}
    >
      {amount ? (
        <>
          {currency && (
            <span className="flex shrink-0 [--order-row-logo-size:18px] max-sm:[--order-row-logo-size:16px]">
              <CurrencyLogo currency={currency} size="var(--order-row-logo-size)" />
            </span>
          )}
          <span className="min-w-0 overflow-hidden whitespace-nowrap">
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
  amountPrefix: AmountSign
  filledPercentText: string
  filledProgressPercent: number
}

const SizeCell = ({ amount, currency, amountPrefix, filledPercentText, filledProgressPercent }: SizeCellProps) => {
  const symbol = currency?.wrapped.symbol

  return (
    <HStack className="w-full min-w-0 items-start gap-1">
      {currency && (
        <HStack className="h-5 shrink-0 items-center [--order-row-logo-size:18px] max-sm:[--order-row-logo-size:16px]">
          <CurrencyLogo currency={currency.wrapped} size="var(--order-row-logo-size)" />
        </HStack>
      )}
      <Stack className="min-w-0 gap-1 max-sm:gap-y-0">
        <HStack
          className="min-w-0 items-center gap-1 text-sm font-medium text-text"
          title={formatAmountWithSymbol(amount, symbol, amountPrefix)}
        >
          <span className="min-w-0 overflow-hidden whitespace-nowrap">
            {amountPrefix}
            {amount}
          </span>
          {symbol && <span className="shrink-0 whitespace-nowrap">{symbol}</span>}
        </HStack>
        <HStack className="min-w-0 items-center gap-1 text-xs text-subText max-sm:hidden">
          <span className="min-w-12 whitespace-nowrap">
            <Trans>Fill</Trans> {filledPercentText}%
          </span>
          <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-subText-40">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.min(filledProgressPercent, 100)}%` }}
            />
          </span>
        </HStack>
      </Stack>
    </HStack>
  )
}

const AvailableCell = ({ amount, symbol }: { amount?: string; symbol?: string }) => (
  <div className="w-full min-w-0 max-sm:col-start-2 max-sm:row-start-1">
    <AmountText amount={amount} symbol={symbol} />
  </div>
)

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
    <div className="flex w-full min-w-0 flex-col items-start gap-1 max-sm:flex-row max-sm:items-center">
      <span
        className={cn('block min-w-0 max-w-full overflow-hidden whitespace-nowrap text-sm font-medium', className)}
        title={formattedRate}
      >
        {formattedRate}
      </span>
      {formattedMarketDiffPercent && (
        <div className="whitespace-nowrap text-xs text-subText">
          {formatRatePercentText(formattedMarketDiffPercent)}
        </div>
      )}
    </div>
  )
}

type TotalCellProps = {
  amount?: string
  currency?: Currency
  amountPrefix: AmountSign
}

const TotalCell = ({ amount, currency, amountPrefix }: TotalCellProps) => (
  <div className="w-full min-w-0 max-sm:col-start-1 max-sm:row-start-2">
    <AmountText amount={amount} currency={currency} amountPrefix={amountPrefix} />
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

  const filledPercent = Math.max(0, Math.min(Number(order.filledPercent) || 0, 100))
  const sizeAmount = reverse ? order.formattedTakerAmount : order.formattedMakerAmount
  const availableAmount = reverse ? order.formattedAvailableTakerAmount : order.formattedAvailableMakerAmount
  const totalAmount = reverse ? order.formattedMakerAmount : order.formattedTakerAmount
  const sizeAmountPrefix = reverse ? AmountSign.Plus : AmountSign.Minus
  const totalAmountPrefix = reverse ? AmountSign.Minus : AmountSign.Plus

  return (
    <RowWrapper className="px-4 py-2 max-sm:gap-y-0">
      <SizeCell
        amount={sizeAmount}
        currency={makerCurrency}
        amountPrefix={sizeAmountPrefix}
        filledPercentText={filledPercent.toString()}
        filledProgressPercent={filledPercent}
      />
      <AvailableCell amount={availableAmount} symbol={makerCurrency?.wrapped.symbol} />
      <div className="w-full min-w-0 max-sm:col-start-2 max-sm:row-start-2">
        <RateCell order={order} className={reverse ? 'text-primary' : 'text-red'} showInvertedRate={showInvertedRate} />
      </div>
      <TotalCell amount={totalAmount} currency={takerCurrency} amountPrefix={totalAmountPrefix} />
      <Stack className="gap-1 max-sm:col-start-3 max-sm:row-span-2 max-sm:row-start-1">
        <span className="hidden whitespace-nowrap text-xs text-subText max-sm:block">
          <Trans>Fill</Trans> {filledPercent.toString()}%
        </span>
        {order.hasAvailable && (
          <button
            type="button"
            onClick={() => onTake?.(order)}
            className="rounded-full bg-primary-20 px-4 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-30 max-sm:px-2 max-sm:py-0.5 max-sm:text-xs"
          >
            <Trans>Take</Trans>
          </button>
        )}
      </Stack>
    </RowWrapper>
  )
}

export default OrderRow
