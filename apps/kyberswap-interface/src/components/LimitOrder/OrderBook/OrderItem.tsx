import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const formatAmountWithSymbol = (amount: string, currency?: Currency) => `${amount} ${currency?.symbol ?? ''}`.trim()

type SizeInfoProps = {
  amount: string
  currency?: Currency
  filledPercent: number
}

const SizeInfo = ({ amount, currency, filledPercent }: SizeInfoProps) => (
  <div className="flex w-full min-w-0 flex-col text-right">
    <div className="truncate text-sm font-medium text-text" title={formatAmountWithSymbol(amount, currency)}>
      {formatAmountWithSymbol(amount, currency)}
    </div>
    <div className="flex items-center justify-end gap-2 text-xs text-subText">
      <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-subText-40">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(filledPercent, 100)}%` }} />
      </span>
      <span className="min-w-16 whitespace-nowrap text-right">
        <Trans>Fill</Trans> {filledPercent}%
      </span>
    </div>
  </div>
)

type AmountTextProps = {
  amount?: string
  currency?: Currency
  muted?: boolean
}

const AmountText = ({ amount, currency, muted }: AmountTextProps) => (
  <div
    className={cn('w-full min-w-0 truncate text-right text-sm font-medium', muted ? 'text-subText' : 'text-text')}
    title={amount ? formatAmountWithSymbol(amount, currency) : undefined}
  >
    {amount ? formatAmountWithSymbol(amount, currency) : '--'}
  </div>
)

type RateTextProps = {
  order: LimitOrderFromTokenPairFormatted
  className?: string
  showInvertedRate?: boolean
}

const RateText = ({ order, className, showInvertedRate }: RateTextProps) => {
  const rate = showInvertedRate ? order.invertedRate : order.rate
  const formattedRate = showInvertedRate ? order.formattedInvertedRate : order.formattedRate
  const formattedMarketDiffPercent = showInvertedRate
    ? order.formattedInvertedMarketDiffPercent
    : order.formattedMarketDiffPercent

  return (
    <div className="flex w-full min-w-0 flex-col items-end text-right">
      <div className={cn('w-full truncate text-sm font-medium', className)} title={rate}>
        {formattedRate}
      </div>
      {formattedMarketDiffPercent && <div className="text-xs text-subText">{formattedMarketDiffPercent}</div>}
    </div>
  )
}

type OrderItemProps = {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  onTake?: (order: LimitOrderFromTokenPairFormatted) => void
  showInvertedRate?: boolean
}

const OrderItem = ({ reverse, order, onTake, showInvertedRate }: OrderItemProps) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()

  const chain = NETWORKS_INFO[order.chainId]
  const filledPercent = Math.max(0, Math.min(Number(order.filledPercent) || 0, 100))
  const sizeAmount = !reverse ? order.formattedMakerAmount : order.formattedTakerAmount
  const availableAmount = !reverse ? order.formattedAvailableMakerAmount : order.formattedAvailableTakerAmount
  const totalAmount = !reverse ? order.formattedTakerAmount : order.formattedMakerAmount
  const sizeCurrency = !reverse ? makerCurrency : takerCurrency
  const totalCurrency = !reverse ? takerCurrency : makerCurrency
  const rateClassName = reverse ? 'text-primary' : 'text-red'

  return (
    <RowWrapper className="min-h-14 px-4 py-2">
      <span className="flex items-center justify-center">
        <img className="size-5" src={chain?.icon} alt="Network" />
      </span>
      <SizeInfo amount={sizeAmount} currency={sizeCurrency} filledPercent={filledPercent} />
      {!upToExtraSmall && <AmountText amount={availableAmount} currency={sizeCurrency} muted={!order.hasAvailable} />}
      <RateText order={order} className={rateClassName} showInvertedRate={showInvertedRate} />
      <AmountText
        amount={order.hasAvailable ? totalAmount : undefined}
        currency={totalCurrency}
        muted={!order.hasAvailable}
      />
      {!upToExtraSmall && (
        <CopyHelper toCopy={String(order.id)} margin="0" size={16} className="justify-self-end text-subText" />
      )}
      {!upToExtraSmall && (
        <div className="justify-self-end">
          {order.hasAvailable && (
            <button
              type="button"
              onClick={() => onTake?.(order)}
              className="rounded-full bg-primary-20 px-4 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-30"
            >
              <Trans>Take</Trans>
            </button>
          )}
        </div>
      )}
    </RowWrapper>
  )
}

export default OrderItem
