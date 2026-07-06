import { Token } from '@kyberswap/ks-sdk-core'
import { MouseEventHandler, useMemo, useState } from 'react'
import { ExternalLink as LinkIcon, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import IconButton from 'components/IconButton'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { RowWrapper, RowWrapperLayout } from 'components/LimitOrder/MyOrders/TableHeader'
import {
  AvailableCell,
  MOBILE_STATUS_LAYOUT,
  RateCell,
  SizeCell,
  StatusCell,
  TokenAmountLine,
} from 'components/LimitOrder/MyOrders/components'
import {
  formatOrderDisplayAmount,
  formatOrderTime,
  getFilledProgressPercent,
  getNeededMakingAmount,
  getOrderRate,
} from 'components/LimitOrder/MyOrders/utils'
import { LimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import {
  calcPercentFilledOrder,
  getLimitOrderDisplayTakerSymbol,
  isActiveStatus,
  isLimitOrderNativeOutput,
} from 'components/LimitOrder/utils'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useTokenBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink, isSupportLimitOrder } from 'utils/index'

type CancelOrderButtonProps = {
  className?: string
  onClick: MouseEventHandler<HTMLButtonElement>
}

const CancelOrderButton = ({ className, onClick }: CancelOrderButtonProps) => (
  <IconButton
    className={cn(
      'p-0 text-subText hover:bg-white/10 hover:text-red disabled:text-subText-40 disabled:opacity-100',
      className,
    )}
    onClick={onClick}
  >
    <Trash size={16} />
  </IconButton>
)

const TxLink = ({ chainId, txHash }: { chainId: LimitOrder['chainId']; txHash?: string }) => {
  if (!txHash || !isSupportedChainId(chainId)) return null

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

type OrderRowProps = {
  order: LimitOrder
  onCancelOrder: (order: LimitOrder) => void
  isOrderCancelling: (order: LimitOrder) => boolean
  isActiveTab: boolean
}

const OrderRow = ({ order, onCancelOrder, isOrderCancelling, isActiveTab }: OrderRowProps) => {
  const navigate = useNavigate()
  const { chainId } = useLimitOrderContext()
  const [expand, setExpand] = useState(false)

  const isSupportedOrderChain = isSupportedChainId(order.chainId)
  const isSupportedLimitOrderChain = isSupportedOrderChain && isSupportLimitOrder(order.chainId)
  const networkInfo = isSupportedOrderChain ? NETWORKS_INFO[order.chainId] : undefined
  const isOrderActive = isActiveStatus(order.status)
  const txs = order.transactions || []
  const canOpenOrder = isSupportedLimitOrderChain && order.chainId === chainId

  const makerCurrency = useMemo(() => {
    if (!isSupportedOrderChain) return undefined
    return new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  }, [isSupportedOrderChain, order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol])
  const availableAmount = useMemo(
    () => (makerCurrency ? getNeededMakingAmount(order, makerCurrency) : undefined),
    [makerCurrency, order],
  )

  const makingTokenBalance = useTokenBalance(makerCurrency)

  const isCancelling = isOrderCancelling(order)
  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const isFilledOrder = order.status === LimitOrderStatus.FILLED || order.takingAmount === order.filledTakingAmount

  const takerSymbol = getLimitOrderDisplayTakerSymbol(order)
  const takerLogo = isLimitOrderNativeOutput(order)
    ? networkInfo?.nativeToken.logo || order.takerAssetLogoURL
    : order.takerAssetLogoURL

  const filledPercent = calcPercentFilledOrder(order.filledTakingAmount, order.takingAmount, order.takerAssetDecimals)
  const rawRate = getOrderRate(order)
  const insufficientFund =
    isOrderActive && makingTokenBalance && availableAmount ? makingTokenBalance.lessThan(availableAmount) : false
  const availableAmountText =
    isOrderActive && availableAmount
      ? formatOrderDisplayAmount(availableAmount.quotient.toString(), order.makerAssetDecimals)
      : undefined

  const canExpandTxs = txs.length > 0
  const showFallbackTxLink = isFilledOrder && !txs.length && !!order.txHash
  const canHardCancelInstead =
    order.status === LimitOrderStatus.CANCELLING && !!order.operatorSignatureExpiredAt && isCancelling
  const showCancelAction =
    isSupportedLimitOrderChain && isActiveTab && ((isOrderActive && !isCancelling) || canHardCancelInstead)
  const mobileStatusLayout = isActiveTab ? MOBILE_STATUS_LAYOUT.ACTIVE : MOBILE_STATUS_LAYOUT.HISTORY
  const rowLayout: RowWrapperLayout = isActiveTab ? RowWrapperLayout.ACTIVE : RowWrapperLayout.HISTORY

  const onClickOrder = () => {
    if (!canOpenOrder || !networkInfo) return
    const search = new URLSearchParams({ tab: LimitOrderTab.ORDER_BOOK }).toString()
    navigate(`${APP_PATHS.LIMIT}/${networkInfo.route}/${order.makerAsset}-to-${order.takerAsset}?${search}`)
  }

  const onClickCancelOrder: MouseEventHandler<HTMLButtonElement> = event => {
    event.stopPropagation()
    onCancelOrder(order)
  }

  return (
    <>
      <RowWrapper layout={rowLayout} className="min-h-16 px-4 py-2">
        <span className="flex items-center justify-center max-sm:row-span-2 max-sm:self-center">
          {networkInfo?.icon && <img className="size-5" src={networkInfo.icon} alt="Network" />}
        </span>
        <SizeCell
          makerAmount={formatOrderDisplayAmount(order.makingAmount, order.makerAssetDecimals)}
          makerLogo={order.makerAssetLogoURL}
          makerSymbol={order.makerAssetSymbol}
          takerAmount={formatOrderDisplayAmount(order.takingAmount, order.takerAssetDecimals)}
          takerLogo={takerLogo}
          takerSymbol={takerSymbol}
          canOpenOrder={canOpenOrder}
          onClick={onClickOrder}
        />
        <div className="min-w-0 max-sm:col-start-3 max-sm:row-start-1">
          <RateCell rate={rawRate} makerSymbol={order.makerAssetSymbol} takerSymbol={takerSymbol} />
        </div>
        {isActiveTab && (
          <div className="min-w-0 max-sm:col-start-3 max-sm:row-start-2 [&>div]:max-sm:justify-end [&>div]:max-sm:text-right">
            <AvailableCell amount={availableAmountText} symbol={order.makerAssetSymbol} />
          </div>
        )}
        <div className="min-w-0 justify-self-end text-right max-sm:hidden">
          <div className="flex min-w-0 flex-col items-end gap-1 text-sm font-medium text-subText">
            <span className="whitespace-nowrap">{formatOrderTime(order.createdAt)}</span>
            <span className="whitespace-nowrap">{formatOrderTime(order.expiredAt)}</span>
          </div>
        </div>
        <div
          className={cn(
            'justify-self-start text-left',
            isActiveTab
              ? 'max-sm:col-start-2 max-sm:row-start-2 max-sm:justify-self-start max-sm:text-left'
              : 'max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-2 max-sm:justify-self-stretch max-sm:text-left',
          )}
        >
          <StatusCell
            filledPercent={filledPercent}
            filledProgressPercent={getFilledProgressPercent(filledPercent)}
            status={status}
            warning={insufficientFund}
            mobileLayout={mobileStatusLayout}
          />
        </div>
        {showCancelAction && isActiveTab && (
          <div className="hidden max-sm:col-start-4 max-sm:row-span-2 max-sm:row-start-1 max-sm:flex max-sm:items-center max-sm:justify-end">
            <CancelOrderButton onClick={onClickCancelOrder} />
          </div>
        )}
        <span className="flex justify-end gap-1 max-sm:hidden">
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
          {showCancelAction && <CancelOrderButton onClick={onClickCancelOrder} />}
        </span>
      </RowWrapper>
      {canExpandTxs && (
        <div
          className={cn(
            'grid bg-white/[0.02] transition-[grid-template-rows,opacity] duration-200 ease-in-out max-sm:hidden',
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
                <RowWrapper key={tx.txHash} layout={rowLayout} className="px-4 py-2">
                  <span />
                  <div className="col-start-2">
                    <TokenAmountLine
                      amount={formatOrderDisplayAmount(tx.takingAmount, order.takerAssetDecimals)}
                      logo={takerLogo}
                      symbol={takerSymbol}
                      prefix="+"
                    />
                  </div>
                  <span
                    className={cn(
                      'justify-self-end whitespace-nowrap text-sm font-medium text-subText',
                      isActiveTab ? 'col-start-5' : 'col-start-4',
                    )}
                  >
                    {formatOrderTime(tx.txTime)}
                  </span>
                  <span
                    className={cn(
                      'justify-self-start text-sm font-medium text-subText',
                      isActiveTab ? 'col-start-6' : 'col-start-5',
                    )}
                  >
                    {txFilledPercent}%
                  </span>
                  <span className={cn('flex w-[60px] justify-end gap-1', isActiveTab ? 'col-start-7' : 'col-start-6')}>
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

export default OrderRow
