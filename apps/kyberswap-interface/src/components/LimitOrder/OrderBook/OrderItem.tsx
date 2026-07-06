import { Trans } from '@lingui/macro'

import CopyHelper from 'components/Copy'
import { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { AmountWithSymbol, ClippedText, SizeInfo } from 'components/LimitOrder/components'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { formatRatePercentText } from 'components/LimitOrder/utils'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'

type RateTextProps = {
  order: LimitOrderFromTokenPairFormatted
  className?: string
  showInvertedRate?: boolean
}

const RateText = ({ order, className, showInvertedRate }: RateTextProps) => {
  const formattedRate = showInvertedRate ? order.formattedInvertedRate : order.formattedRate
  const formattedMarketDiffPercent = showInvertedRate
    ? order.formattedInvertedMarketDiffPercent
    : order.formattedMarketDiffPercent

  return (
    <div className="flex w-full min-w-0 flex-col items-end text-right">
      <ClippedText className={cn('text-sm font-medium', className)} title={formattedRate}>
        {formattedRate}
      </ClippedText>
      {formattedMarketDiffPercent && (
        <div className="text-xs text-subText">{formatRatePercentText(formattedMarketDiffPercent)}</div>
      )}
    </div>
  )
}

type OrderItemProps = {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  onTake?: (order: LimitOrderFromTokenPairFormatted) => void
  showInvertedRate?: boolean
}

const OrderItem = ({ reverse = false, order, onTake, showInvertedRate }: OrderItemProps) => {
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()

  const chain = NETWORKS_INFO[order.chainId]
  const filledPercent = Math.max(0, Math.min(Number(order.filledPercent) || 0, 100))
  const sizeAmount = order.formattedMakerAmount
  const availableAmount = order.formattedAvailableMakerAmount
  const totalAmount = order.formattedTakerAmount
  const sizeCurrency = !reverse ? makerCurrency : takerCurrency
  const totalCurrency = !reverse ? takerCurrency : makerCurrency

  return (
    <RowWrapper className="min-h-14 px-4 py-2">
      <span className="flex items-center justify-center max-sm:row-start-1">
        <img className="size-5" src={chain?.icon} alt="Network" />
      </span>
      <SizeInfo
        amount={sizeAmount}
        currency={sizeCurrency}
        reverse={reverse}
        filledPercentText={filledPercent.toString()}
        filledProgressPercent={filledPercent}
      />
      <div className="min-w-0 max-sm:col-start-3 max-sm:row-start-2">
        <AmountWithSymbol amount={availableAmount} symbol={sizeCurrency?.wrapped.symbol} />
      </div>
      <div className="min-w-0 max-sm:col-start-3 max-sm:row-start-1">
        <RateText order={order} className={reverse ? 'text-primary' : 'text-red'} showInvertedRate={showInvertedRate} />
      </div>
      <div className="min-w-0 max-sm:col-start-2 max-sm:row-start-2 [&>div]:max-sm:justify-start [&>div]:max-sm:text-left">
        <AmountWithSymbol amount={totalAmount} currency={totalCurrency} reverse={reverse} />
      </div>
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

export default OrderItem
