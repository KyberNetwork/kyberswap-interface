import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { ExternalLink as LinkIcon, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import IconButton from 'components/IconButton'
import { RowWrapper } from 'components/LimitOrder/MyOrders/TableHeader'
import { formatStatus } from 'components/LimitOrder/MyOrders/utils'
import { calcPercentFilledOrder, getMarketPriceDiff, isActiveStatus } from 'components/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useTokenBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { getEtherscanLink } from 'utils/index'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const formatAmountWithSymbol = (amount: string, symbol?: string) => `${amount} ${symbol ?? ''}`.trim()

const formatOrderDisplayAmount = (amount: string, decimals: number) =>
  formatDisplayNumber(uint256ToFraction(amount, decimals).toFixed(18), { significantDigits: 6 })

const getOrderRate = (order: LimitOrder) => {
  const rate = uint256ToFraction(order.takingAmount, order.takerAssetDecimals).divide(
    uint256ToFraction(order.makingAmount, order.makerAssetDecimals),
  )
  return rate.toFixed(18)
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
    <div className="flex w-full min-w-0 flex-col text-right">
      <div className="truncate text-sm font-medium text-text" title={formatAmountWithSymbol(amount, symbol)}>
        {formatAmountWithSymbol(amount, symbol)}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-subText">
        <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-subText-40">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
        </span>
        <span className="min-w-16 whitespace-nowrap text-right">
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

const RateText = ({ rate, marketRate }: { rate: string; marketRate?: number }) => {
  const marketDiff = getMarketPriceDiff(rate, marketRate)
  const displayRate = formatDisplayNumber(rate, { significantDigits: 6 })

  return (
    <div className="flex w-full min-w-0 flex-col items-end text-right">
      <div className="w-full truncate text-sm font-medium text-primary" title={displayRate}>
        {displayRate}
      </div>
      {marketDiff.displayPercent && <div className="text-xs text-subText">{marketDiff.displayPercent}</div>}
    </div>
  )
}

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
      {warning ? formatStatus(LimitOrderStatus.INSUFFICIENT_FUNDS) : formatStatus(status)}
    </span>
  )
}

const TxLink = ({ chainId, txHash }: { chainId: LimitOrder['chainId']; txHash?: string }) => {
  if (!txHash) return null

  return (
    <ExternalLink
      href={getEtherscanLink(chainId, txHash, 'transaction')}
      className="flex size-7 items-center justify-center rounded-full text-primary hover:bg-white/10 hover:no-underline"
      onClick={event => event.stopPropagation()}
    >
      <LinkIcon size={15} />
    </ExternalLink>
  )
}

type OrderItemProps = {
  order: LimitOrder
  onCancelOrder: (order: LimitOrder) => void
  isOrderCancelling: (order: LimitOrder) => boolean
}

const OrderItem = ({ order, onCancelOrder, isOrderCancelling }: OrderItemProps) => {
  const navigate = useNavigate()
  const [expand, setExpand] = useState(false)

  const isOrderActive = isActiveStatus(order.status)
  const txs = order.transactions || []

  const availableAmount = useMemo(() => getNeededMakingAmount(order), [order])
  const makerCurrency = useMemo(() => {
    return new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  }, [order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol])
  const takerCurrency = useMemo(() => {
    return new Token(order.chainId, order.takerAsset, order.takerAssetDecimals, order.takerAssetSymbol, '')
  }, [order.chainId, order.takerAsset, order.takerAssetDecimals, order.takerAssetSymbol])

  const { tradeInfo } = useBaseTradeInfoLimitOrder(
    isOrderActive ? makerCurrency : undefined,
    isOrderActive ? takerCurrency : undefined,
    order.chainId,
  )

  const makingTokenBalance = useTokenBalance(makerCurrency)

  const isCancelling = isOrderCancelling(order)
  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const isFilledOrder = order.status === LimitOrderStatus.FILLED || order.takingAmount === order.filledTakingAmount

  const native = NativeCurrencies[order.chainId]
  const isNative = order.nativeOutput && order.takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
  const takerSymbol = isNative ? native?.symbol || order.takerAssetSymbol : order.takerAssetSymbol

  const filledPercent = calcPercentFilledOrder(order.filledTakingAmount, order.takingAmount, order.takerAssetDecimals)
  const rawRate = getOrderRate(order)
  const insufficientFund = isOrderActive && makingTokenBalance ? makingTokenBalance.lessThan(availableAmount) : false

  const canExpandTxs = txs.length > 0
  const showFallbackTxLink = isFilledOrder && !txs.length && !!order.txHash
  const canHardCancelInstead =
    order.status === LimitOrderStatus.CANCELLING && !!order.operatorSignatureExpiredAt && isCancelling
  const showCancelAction = isOrderActive || canHardCancelInstead

  const onClickOrder = () => {
    const search = new URLSearchParams({ tab: LimitOrderTab.ORDER_BOOK }).toString()

    navigate(
      `${APP_PATHS.LIMIT}/${NETWORKS_INFO[order.chainId].route}/${order.makerAsset}-to-${order.takerAsset}?${search}`,
    )
  }

  return (
    <>
      <RowWrapper className="min-h-16 cursor-pointer px-4 py-2 hover:bg-primary-20" onClick={onClickOrder}>
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
        <RateText rate={rawRate} marketRate={tradeInfo?.marketRate} />
        <AmountText
          amount={formatOrderDisplayAmount(order.takingAmount, order.takerAssetDecimals)}
          symbol={takerSymbol}
        />
        <span className="justify-self-end max-[640px]:hidden">
          <StatusPill status={status} warning={insufficientFund} />
        </span>
        <span className="flex justify-end gap-1 max-[640px]:hidden">
          {showFallbackTxLink && <TxLink chainId={order.chainId} txHash={order.txHash} />}
          {canExpandTxs && (
            <IconButton
              className="p-0 text-subText hover:bg-white/10 hover:text-primary disabled:text-subText-40 disabled:opacity-100"
              onClick={event => {
                event.stopPropagation()
                setExpand(value => !value)
              }}
            >
              <DropdownArrowIcon rotate={expand} className="text-subText" />
            </IconButton>
          )}
          {showCancelAction && (
            <IconButton
              className="p-0 text-subText hover:bg-white/10 hover:text-red disabled:text-subText-40 disabled:opacity-100"
              onClick={event => {
                event.stopPropagation()
                onCancelOrder(order)
              }}
            >
              <Trash size={16} />
            </IconButton>
          )}
        </span>
      </RowWrapper>
      {canExpandTxs && (
        <div
          className={cn(
            'grid bg-white/[0.02] transition-[grid-template-rows,opacity] duration-200 ease-in-out max-[640px]:hidden',
            expand ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            {txs.map(tx => {
              const txFilledPercent = calcPercentFilledOrder(
                tx.takingAmount,
                order.takingAmount,
                order.takerAssetDecimals,
              )

              return (
                <RowWrapper key={tx.txHash} className="px-4 py-2">
                  <span className="col-start-2 justify-self-end text-sm font-medium text-subText">
                    {txFilledPercent}%
                  </span>
                  <div className="col-start-5">
                    <AmountText
                      amount={formatOrderDisplayAmount(tx.takingAmount, order.takerAssetDecimals)}
                      symbol={takerSymbol}
                      muted
                    />
                  </div>
                  <span className="col-start-6 justify-self-end text-xs font-medium text-subText">
                    {new Date(tx.txTime * 1000).toLocaleString()}
                  </span>
                  <span className="col-start-7 flex justify-end gap-1">
                    <span className="flex size-7 items-center justify-center rounded-full text-subText transition-colors hover:bg-white/10 hover:text-primary">
                      <CopyHelper toCopy={tx.txHash} margin="0" size={15} />
                    </span>
                    <TxLink chainId={order.chainId} txHash={tx.txHash} />
                  </span>
                </RowWrapper>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export default OrderItem
