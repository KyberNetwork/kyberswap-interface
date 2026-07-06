import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { MouseEventHandler, useMemo, useState } from 'react'
import { ExternalLink as LinkIcon, Repeat, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import IconButton from 'components/IconButton'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { RowWrapper } from 'components/LimitOrder/MyOrders/TableHeader'
import { formatStatus } from 'components/LimitOrder/MyOrders/utils'
import { ClippedText } from 'components/LimitOrder/components'
import { LimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import {
  calcPercentFilledOrder,
  getLimitOrderDisplayTakerSymbol,
  isActiveStatus,
  isLimitOrderNativeOutput,
} from 'components/LimitOrder/utils'
import Logo from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useTokenBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { getEtherscanLink, isSupportLimitOrder } from 'utils/index'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const formatOrderDisplayAmount = (amount: string, decimals: number) =>
  formatDisplayNumber(uint256ToFraction(amount, decimals).toFixed(18), { significantDigits: 6 })

const formatOrderTime = (timestamp: number) => dayjs(timestamp * 1000).format('DD/MM/YYYY HH:mm')

const getOrderRate = (order: LimitOrder) => {
  const rate = uint256ToFraction(order.takingAmount, order.takerAssetDecimals).divide(
    uint256ToFraction(order.makingAmount, order.makerAssetDecimals),
  )
  return rate.toFixed(18)
}

const getNeededMakingAmount = (order: LimitOrder, makingToken: Token) => {
  const makingAmount = toCurrencyAmount(makingToken, order.makingAmount)
  const filledMakingAmount = toCurrencyAmount(makingToken, order.filledMakingAmount)

  return makingAmount.subtract(filledMakingAmount)
}

const getFilledProgressPercent = (filledPercent: string) =>
  filledPercent.startsWith('<') ? 0.01 : Number(filledPercent.replace(/,/g, '')) || 0

const MOBILE_STATUS_LAYOUT = {
  ACTIVE: 'active',
  HISTORY: 'history',
} as const

type MobileStatusLayout = (typeof MOBILE_STATUS_LAYOUT)[keyof typeof MOBILE_STATUS_LAYOUT]

type RateCellProps = {
  rate: string
  makerSymbol: string
  takerSymbol: string
}

const RateCell = ({ rate, makerSymbol, takerSymbol }: RateCellProps) => {
  const [showInverted, setShowInverted] = useState(false)
  const displayRate = formatDisplayNumber(showInverted ? 1 / Number(rate) : rate, { significantDigits: 6 })
  const baseSymbol = showInverted ? takerSymbol : makerSymbol
  const quoteSymbol = showInverted ? makerSymbol : takerSymbol
  const pairLabel = `${baseSymbol}/${quoteSymbol}`

  return (
    <div className="flex w-full min-w-0 flex-col items-end gap-1 text-right">
      <div className="flex min-w-0 items-center justify-end gap-1 text-sm font-medium text-subText">
        <span className="min-w-0 truncate" title={pairLabel}>
          {pairLabel}
        </span>
        <button
          type="button"
          className="flex shrink-0 items-center text-subText transition hover:brightness-75"
          onClick={event => {
            event.stopPropagation()
            setShowInverted(value => !value)
          }}
          aria-label="Invert rate"
        >
          <Repeat size={14} />
        </button>
      </div>
      <ClippedText className="text-sm font-medium text-primary" title={displayRate}>
        {displayRate}
      </ClippedText>
    </div>
  )
}

const StatusPill = ({
  status,
  warning,
  className,
}: {
  status: LimitOrderStatus
  warning?: boolean
  className?: string
}) => {
  const active = isActiveStatus(status)
  const danger = [LimitOrderStatus.CANCELLED, LimitOrderStatus.CANCELLING].includes(status)
  const caution = warning || [LimitOrderStatus.EXPIRED, LimitOrderStatus.INSUFFICIENT_FUNDS].includes(status)

  return (
    <span
      className={cn(
        'block text-sm font-medium opacity-90',
        active && !warning && 'text-primary',
        danger && 'text-red',
        caution && 'text-warning',
        status === LimitOrderStatus.FILLED && 'text-primary',
        className,
      )}
    >
      {warning ? formatStatus(LimitOrderStatus.INSUFFICIENT_FUNDS) : formatStatus(status)}
    </span>
  )
}

const TokenAmountLine = ({
  amount,
  logo,
  symbol,
  prefix,
  muted,
}: {
  amount: string
  logo: string
  symbol: string
  prefix: '+' | '-'
  muted?: boolean
}) => (
  <div
    className={cn('flex min-w-0 items-center gap-1 text-sm font-medium', muted ? 'text-subText' : 'text-text')}
    title={`${prefix}${amount} ${symbol}`.trim()}
  >
    <Logo srcs={[logo]} alt={`${symbol || 'token'} logo`} className="size-4 rounded" />
    <span className="min-w-0 overflow-hidden whitespace-nowrap text-left">
      {prefix}
      {amount}
    </span>
    <span className="shrink-0 whitespace-nowrap">{symbol}</span>
  </div>
)

type SizeCellProps = {
  makerAmount: string
  makerLogo: string
  makerSymbol: string
  takerAmount: string
  takerLogo: string
  takerSymbol: string
  canOpenOrder: boolean
  onClick: () => void
}

const SizeCell = ({
  makerAmount,
  makerLogo,
  makerSymbol,
  takerAmount,
  takerLogo,
  takerSymbol,
  canOpenOrder,
  onClick,
}: SizeCellProps) => (
  <button
    type="button"
    className={cn(
      'flex min-w-0 flex-col gap-1 border-0 bg-transparent p-0 text-left',
      canOpenOrder && 'cursor-pointer hover:brightness-75',
    )}
    onClick={onClick}
  >
    <TokenAmountLine amount={makerAmount} logo={makerLogo} symbol={makerSymbol} prefix="-" />
    <TokenAmountLine amount={takerAmount} logo={takerLogo} symbol={takerSymbol} prefix="+" muted />
  </button>
)

const AvailableCell = ({ amount, symbol, muted }: { amount?: string; symbol?: string; muted?: boolean }) => (
  <div
    className={cn(
      'flex w-full min-w-0 items-center justify-end gap-1 text-right text-sm font-medium',
      muted ? 'text-subText' : 'text-text',
    )}
    title={amount ? `${amount} ${symbol ?? ''}`.trim() : undefined}
  >
    {amount ? (
      <>
        <span className="min-w-0 overflow-hidden whitespace-nowrap text-left">{amount}</span>
        {symbol && <span className="shrink-0 whitespace-nowrap">{symbol}</span>}
      </>
    ) : (
      '--'
    )}
  </div>
)

const StatusCell = ({
  filledPercent,
  filledProgressPercent,
  status,
  warning,
  mobileLayout,
}: {
  filledPercent: string
  filledProgressPercent: number
  status: LimitOrderStatus
  warning?: boolean
  mobileLayout: MobileStatusLayout
}) => {
  const isActiveMobileLayout = mobileLayout === MOBILE_STATUS_LAYOUT.ACTIVE
  const isHistoryMobileLayout = mobileLayout === MOBILE_STATUS_LAYOUT.HISTORY

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-start gap-1 max-sm:items-end',
        isActiveMobileLayout && 'max-sm:items-start',
        isHistoryMobileLayout && 'max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:justify-between',
      )}
    >
      <div className="flex min-w-0 items-center gap-1 text-sm text-subText max-sm:justify-end max-sm:text-text">
        <span className="whitespace-nowrap">
          <Trans>Fill</Trans> {filledPercent}%
        </span>
        <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-subText-40">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.min(filledProgressPercent, 100)}%` }}
          />
        </span>
      </div>
      <StatusPill
        status={status}
        warning={warning}
        className={cn('text-left max-sm:text-right', isActiveMobileLayout && 'max-sm:hidden')}
      />
    </div>
  )
}

const CancelOrderButton = ({
  className,
  onClick,
}: {
  className?: string
  onClick: MouseEventHandler<HTMLButtonElement>
}) => (
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
      <RowWrapper hasMobileActionColumn={isActiveTab} className="min-h-16 px-4 py-2">
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
        <div
          className={cn(
            'min-w-0',
            isActiveTab
              ? 'max-sm:col-start-3 max-sm:row-start-2 [&>div]:max-sm:justify-end [&>div]:max-sm:text-right'
              : 'max-sm:hidden',
          )}
        >
          <AvailableCell amount={availableAmountText} symbol={order.makerAssetSymbol} muted={!isOrderActive} />
        </div>
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
                <RowWrapper key={tx.txHash} className="px-4 py-2">
                  <span />
                  <div className="col-start-2">
                    <TokenAmountLine
                      amount={formatOrderDisplayAmount(tx.takingAmount, order.takerAssetDecimals)}
                      logo={takerLogo}
                      symbol={takerSymbol}
                      prefix="+"
                    />
                  </div>
                  <span className="col-start-5 justify-self-end whitespace-nowrap text-sm font-medium text-subText">
                    {formatOrderTime(tx.txTime)}
                  </span>
                  <span className="col-start-6 justify-self-start text-sm font-medium text-subText">
                    {txFilledPercent}%
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

export default OrderRow
