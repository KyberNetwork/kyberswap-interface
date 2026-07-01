import { Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { ExternalLink as LinkIcon, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import IconButton from 'components/IconButton'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { RowWrapper } from 'components/LimitOrder/MyOrders/TableHeader'
import { formatStatus, formatTxTime } from 'components/LimitOrder/MyOrders/utils'
import { AmountWithSymbol, ClippedText, SizeInfo } from 'components/LimitOrder/components'
import { LimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import {
  calcPercentFilledOrder,
  getLimitOrderDisplayTakerSymbol,
  getMarketPriceDiff,
  isActiveStatus,
} from 'components/LimitOrder/utils'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useTokenBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { getEtherscanLink } from 'utils/index'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

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

const getFilledProgressPercent = (filledPercent: string) =>
  filledPercent.startsWith('<') ? 0.01 : Number(filledPercent.replace(/,/g, '')) || 0

const RateText = ({ rate, marketRate }: { rate: string; marketRate?: number }) => {
  const marketDiff = getMarketPriceDiff(rate, marketRate)
  const displayRate = formatDisplayNumber(rate, { significantDigits: 6 })

  return (
    <div className="flex w-full min-w-0 flex-col items-end text-right">
      <ClippedText className="text-sm font-medium text-primary" title={displayRate}>
        {displayRate}
      </ClippedText>
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
        'block text-right text-sm font-medium opacity-90',
        active && !warning && 'text-primary',
        danger && 'text-red',
        caution && 'text-warning',
        status === LimitOrderStatus.FILLED && 'text-primary',
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
  const { chainId } = useLimitOrderContext()
  const [expand, setExpand] = useState(false)

  const isOrderActive = isActiveStatus(order.status)
  const txs = order.transactions || []
  const canOpenOrder = order.chainId === chainId

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

  const takerSymbol = getLimitOrderDisplayTakerSymbol(order)

  const filledPercent = calcPercentFilledOrder(order.filledTakingAmount, order.takingAmount, order.takerAssetDecimals)
  const rawRate = getOrderRate(order)
  const insufficientFund = isOrderActive && makingTokenBalance ? makingTokenBalance.lessThan(availableAmount) : false

  const canExpandTxs = txs.length > 0
  const showFallbackTxLink = isFilledOrder && !txs.length && !!order.txHash
  const canHardCancelInstead =
    order.status === LimitOrderStatus.CANCELLING && !!order.operatorSignatureExpiredAt && isCancelling
  const showCancelAction = (isOrderActive && !isCancelling) || canHardCancelInstead

  const onClickOrder = () => {
    if (!canOpenOrder) return

    const search = new URLSearchParams({ tab: LimitOrderTab.ORDER_BOOK }).toString()

    navigate(
      `${APP_PATHS.LIMIT}/${NETWORKS_INFO[order.chainId].route}/${order.makerAsset}-to-${order.takerAsset}?${search}`,
    )
  }

  return (
    <>
      <RowWrapper
        className={cn('min-h-16 px-4 py-2', canOpenOrder && 'cursor-pointer hover:bg-primary-20')}
        onClick={onClickOrder}
      >
        <span className="flex items-center justify-center">
          <img className="size-5" src={NETWORKS_INFO[order.chainId]?.icon} alt="Network" />
        </span>
        <SizeInfo
          amount={formatOrderDisplayAmount(order.makingAmount, order.makerAssetDecimals)}
          symbol={order.makerAssetSymbol}
          filledPercentText={filledPercent}
          filledProgressPercent={getFilledProgressPercent(filledPercent)}
        />
        <AmountWithSymbol
          amount={
            isOrderActive
              ? formatOrderDisplayAmount(availableAmount.quotient.toString(), order.makerAssetDecimals)
              : undefined
          }
          symbol={order.makerAssetSymbol}
          muted={!isOrderActive}
        />
        <RateText rate={rawRate} marketRate={tradeInfo?.marketRate} />
        <AmountWithSymbol
          amount={formatOrderDisplayAmount(order.takingAmount, order.takerAssetDecimals)}
          symbol={takerSymbol}
        />
        <span className="justify-self-end text-right max-[640px]:hidden">
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
                    <AmountWithSymbol
                      amount={formatOrderDisplayAmount(tx.takingAmount, order.takerAssetDecimals)}
                      symbol={takerSymbol}
                      muted
                    />
                  </div>
                  <span className="col-start-6 justify-self-end text-xs font-medium text-subText">
                    {formatTxTime(tx.txTime)}
                  </span>
                  <span className="col-start-7 flex w-[60px] justify-end gap-1">
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
