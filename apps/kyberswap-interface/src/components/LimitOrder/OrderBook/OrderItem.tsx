import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { AmountWithSymbol, ClippedText, SizeInfo } from 'components/LimitOrder/components'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

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
      <ClippedText className={cn('text-sm font-medium', className)} title={rate}>
        {formattedRate}
      </ClippedText>
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
  const sizeAmount = order.formattedMakerAmount
  const availableAmount = order.formattedAvailableMakerAmount
  const totalAmount = order.formattedTakerAmount
  const sizeCurrency = !reverse ? makerCurrency : takerCurrency
  const totalCurrency = !reverse ? takerCurrency : makerCurrency
  const rateClassName = reverse ? 'text-primary' : 'text-red'

  return (
    <RowWrapper className="min-h-14 px-4 py-2">
      <span className="flex items-center justify-center">
        <img className="size-5" src={chain?.icon} alt="Network" />
      </span>
      <SizeInfo
        amount={sizeAmount}
        symbol={sizeCurrency?.wrapped.symbol}
        filledPercentText={filledPercent.toString()}
        filledProgressPercent={filledPercent}
      />
      {!upToExtraSmall && <AmountWithSymbol amount={availableAmount} symbol={sizeCurrency?.wrapped.symbol} />}
      <RateText order={order} className={rateClassName} showInvertedRate={showInvertedRate} />
      <AmountWithSymbol amount={totalAmount} symbol={totalCurrency?.wrapped.symbol} />
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
