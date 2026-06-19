import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

export const ItemWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.45fr)_minmax(0,1.2fr)_48px_88px] items-center gap-2 text-sm max-[640px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.35fr)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const formatAmountWithSymbol = (amount: string, currency?: Currency) => `${amount} ${currency?.symbol ?? ''}`.trim()

const SizeInfo = ({
  amount,
  currency,
  filledPercent,
}: {
  amount: string
  currency?: Currency
  filledPercent: number
}) => (
  <div className="flex w-full min-w-0 flex-col text-right">
    <div className="truncate text-sm font-medium text-text" title={formatAmountWithSymbol(amount, currency)}>
      {formatAmountWithSymbol(amount, currency)}
    </div>
    <div className="flex items-center justify-end gap-2 text-xs text-subText">
      <span className="h-1 w-12 overflow-hidden rounded-full bg-subText-40">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(filledPercent, 100)}%` }} />
      </span>
      <span>
        <Trans>Fill</Trans> {filledPercent}%
      </span>
    </div>
  </div>
)

const AmountText = ({ amount, currency, muted }: { amount?: string; currency?: Currency; muted?: boolean }) => (
  <div
    className={cn('w-full min-w-0 truncate text-right text-sm font-medium', muted ? 'text-subText' : 'text-text')}
    title={amount ? formatAmountWithSymbol(amount, currency) : undefined}
  >
    {amount ? formatAmountWithSymbol(amount, currency) : '--'}
  </div>
)

const RateText = ({ order, className }: { order: LimitOrderFromTokenPairFormatted; className?: string }) => (
  <div className="flex w-full min-w-0 flex-col items-end text-right">
    <div className={cn('w-full truncate text-sm font-medium', className)} title={order.rate}>
      {order.formattedRate}
    </div>
    {order.formattedMarketDiffPercent && <div className="text-xs text-subText">{order.formattedMarketDiffPercent}</div>}
  </div>
)

const OrderItem = ({
  reverse,
  order,
  onTake,
}: {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  onTake?: (order: LimitOrderFromTokenPairFormatted) => void
}) => {
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
    <ItemWrapper className="min-h-14 px-4 py-2">
      <span className="flex items-center justify-center">
        <img className="size-5" src={chain?.icon} alt="Network" />
      </span>
      <SizeInfo amount={sizeAmount} currency={sizeCurrency} filledPercent={filledPercent} />
      {!upToExtraSmall && <AmountText amount={availableAmount} currency={sizeCurrency} muted={!order.hasAvailable} />}
      <RateText order={order} className={rateClassName} />
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
    </ItemWrapper>
  )
}

export default OrderItem
