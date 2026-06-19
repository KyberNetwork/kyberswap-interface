import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { calcPercentFilledOrder, isActiveStatus } from 'components/swapv2/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/swapv2/LimitOrder/types'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useTokenBalance } from 'state/wallet/hooks'
import { cn } from 'utils/cn'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const formatAmountWithSymbol = (amount: string, symbol?: string) => `${amount} ${symbol ?? ''}`.trim()

const formatOrderDisplayAmount = (amount: string, decimals: number) =>
  formatDisplayNumber(uint256ToFraction(amount, decimals).toFixed(18), { significantDigits: 6 })

const formatOrderDisplayRate = (order: LimitOrder) => {
  const rate = uint256ToFraction(order.makingAmount, order.makerAssetDecimals).divide(
    uint256ToFraction(order.takingAmount, order.takerAssetDecimals),
  )
  return formatDisplayNumber(rate.toFixed(18), { significantDigits: 6 })
}

const formatStatus = (status: LimitOrderStatus) => {
  switch (status) {
    case LimitOrderStatus.ACTIVE:
    case LimitOrderStatus.OPEN:
      return t`Active`
    case LimitOrderStatus.PARTIALLY_FILLED:
      return t`Partially Filled`
    case LimitOrderStatus.FILLED:
      return t`Filled`
    case LimitOrderStatus.CANCELLING:
      return t`Cancelling`
    case LimitOrderStatus.CANCELLED:
      return t`Cancelled`
    case LimitOrderStatus.EXPIRED:
      return t`Expired`
    case LimitOrderStatus.INSUFFICIENT_FUNDS:
      return t`Insufficient funds`
    default:
      return status.replace('_', ' ')
  }
}

const getNeededMakingAmount = (order: LimitOrder) => {
  const makingToken = new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  const makingAmount = toCurrencyAmount(makingToken, order.makingAmount)
  const filledMakingAmount = toCurrencyAmount(makingToken, order.filledMakingAmount)

  return makingAmount.subtract(filledMakingAmount)
}

const SizeInfo = ({ amount, symbol, filled }: { amount: string; symbol: string; filled: string }) => {
  const progress = filled.startsWith('<') ? 0.01 : Number(filled.replace(/,/g, '')) || 0

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 text-right">
      <div className="truncate text-sm font-medium text-text" title={formatAmountWithSymbol(amount, symbol)}>
        {formatAmountWithSymbol(amount, symbol)}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-subText">
        <span className="h-1 w-12 overflow-hidden rounded-full bg-subText-40">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
        </span>
        <span>
          <Trans>Fill</Trans> {filled}%
        </span>
      </div>
    </div>
  )
}

const AmountText = ({ amount, symbol, muted }: { amount?: string; symbol?: string; muted?: boolean }) => (
  <div
    className={cn('w-full min-w-0 truncate text-right text-sm font-medium', muted ? 'text-subText' : 'text-text')}
    title={amount ? formatAmountWithSymbol(amount, symbol) : undefined}
  >
    {amount ? formatAmountWithSymbol(amount, symbol) : '--'}
  </div>
)

const StatusPill = ({ status, warning }: { status: LimitOrderStatus; warning?: boolean }) => {
  const active = isActiveStatus(status)
  const danger = [LimitOrderStatus.CANCELLED, LimitOrderStatus.CANCELLING].includes(status)
  const caution = warning || [LimitOrderStatus.EXPIRED, LimitOrderStatus.INSUFFICIENT_FUNDS].includes(status)

  return (
    <span
      className={cn(
        'inline-flex min-w-[104px] justify-center rounded-full px-4 py-1 text-sm font-medium',
        active && !warning && 'bg-primary-20 text-primary',
        danger && 'bg-red-20 text-red',
        caution && 'bg-warning-20 text-warning',
        status === LimitOrderStatus.FILLED && 'bg-primary-20 text-primary',
      )}
    >
      {warning ? t`Insufficient funds` : formatStatus(status)}
    </span>
  )
}

const OrderItem = ({
  order,
  onCancelOrder,
  isOrderCancelling,
}: {
  order: LimitOrder
  onCancelOrder: (order: LimitOrder) => void
  isOrderCancelling: (order: LimitOrder) => boolean
}) => {
  const navigate = useNavigate()
  const isCancelling = isOrderCancelling(order)
  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const isOrderActive = isActiveStatus(order.status)

  const native = NativeCurrencies[order.chainId]
  const isNative = order.nativeOutput && order.takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
  const takerSymbol = isNative ? native?.symbol || order.takerAssetSymbol : order.takerAssetSymbol
  const filledPercent = calcPercentFilledOrder(order.filledTakingAmount, order.takingAmount, order.takerAssetDecimals)
  const availableAmount = useMemo(() => getNeededMakingAmount(order), [order])
  const displayRate = formatOrderDisplayRate(order)

  const makingToken = useMemo(() => {
    return new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  }, [order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol])
  const makingTokenBalance = useTokenBalance(makingToken)
  const insufficientFund = isOrderActive && makingTokenBalance ? makingTokenBalance.lessThan(availableAmount) : false

  const onClickOrder = () => {
    const search = new URLSearchParams({ tab: LimitOrderTab.ORDER_BOOK }).toString()

    navigate(
      `${APP_PATHS.LIMIT}/${NETWORKS_INFO[order.chainId].route}/${order.makerAsset}-to-${order.takerAsset}?${search}`,
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.45fr)_minmax(0,1.2fr)_minmax(160px,1fr)_28px] items-center gap-2 text-sm max-[640px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.35fr)]',
        'min-h-16 cursor-pointer px-4 py-2 hover:bg-primary-20',
      )}
      onClick={onClickOrder}
    >
      <span className="flex items-center justify-center">
        <img className="size-5" src={NETWORKS_INFO[order.chainId]?.icon} alt="Network" />
      </span>
      <SizeInfo
        amount={formatOrderDisplayAmount(order.makingAmount, order.makerAssetDecimals)}
        symbol={order.makerAssetSymbol}
        filled={filledPercent}
      />
      <AmountText
        amount={
          isOrderActive
            ? formatOrderDisplayAmount(availableAmount.quotient.toString(), order.makerAssetDecimals)
            : undefined
        }
        symbol={order.makerAssetSymbol}
        muted={!isOrderActive}
      />
      <div className="w-full min-w-0 truncate text-right text-sm font-medium text-primary" title={displayRate}>
        {displayRate}
      </div>
      <AmountText
        amount={formatOrderDisplayAmount(order.takingAmount, order.takerAssetDecimals)}
        symbol={takerSymbol}
      />
      <span className="justify-self-end max-[640px]:hidden">
        <StatusPill status={status} warning={insufficientFund} />
      </span>
      <span className="flex justify-end max-[640px]:hidden">
        {isOrderActive && (
          <button
            type="button"
            className="text-subText transition-colors hover:text-red disabled:cursor-not-allowed disabled:text-subText-40"
            disabled={isCancelling}
            onClick={event => {
              event.stopPropagation()
              onCancelOrder(order)
            }}
          >
            <Trash size={16} />
          </button>
        )}
      </span>
    </div>
  )
}

export default OrderItem
