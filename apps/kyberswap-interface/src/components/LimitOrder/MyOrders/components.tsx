import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Repeat, Trash } from 'react-feather'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { ButtonOutlined } from 'components/Button'
import { LIST_ORDER_TABS, formatStatus } from 'components/LimitOrder/MyOrders/utils'
import { ClippedText } from 'components/LimitOrder/components'
import { LimitOrderStatus } from 'components/LimitOrder/types'
import { isActiveStatus } from 'components/LimitOrder/utils'
import Loader from 'components/Loader'
import Logo from 'components/Logo'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

// Components used by MyOrders index

type CancelAllButtonProps = {
  disabled: boolean
  isLoading: boolean
  onClick: () => void
}

export const CancelAllButton = ({ disabled, isLoading, onClick }: CancelAllButtonProps) => (
  <ButtonOutlined
    onClick={onClick}
    disabled={disabled}
    className={cn('w-fit gap-1.5 px-3 py-1 text-sm', !disabled && '!border-red-35 !text-red')}
  >
    {isLoading ? <Loader size="14px" /> : <Trash size={14} />}
    <Trans>Cancel All</Trans>
  </ButtonOutlined>
)

type TabSelectorProps = {
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}

export const TabSelector = ({ activeTab, setActiveTab }: TabSelectorProps) => (
  <div className="flex min-w-0 flex-1 items-center overflow-x-auto" role="tablist">
    {LIST_ORDER_TABS.map((tab, index) => {
      const active = tab === activeTab
      const isLast = index === LIST_ORDER_TABS.length - 1
      return (
        <button
          key={tab}
          aria-selected={active}
          className={cn(
            'relative flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 border-0 px-4 py-3 text-sm font-medium',
            !isLast && 'border-r border-darkBorder',
            active
              ? 'bg-transparent text-primary hover:bg-transparent hover:text-primary'
              : 'bg-transparent text-subText hover:bg-transparent hover:text-text',
          )}
          onClick={() => setActiveTab(tab)}
          role="tab"
          type="button"
        >
          <span className="text-base font-medium leading-[normal]" style={{ color: 'inherit' }}>
            {tab === LimitOrderStatus.ACTIVE ? <Trans>Active Orders</Trans> : <Trans>Order History</Trans>}
          </span>
        </button>
      )
    })}
  </div>
)

type EmptyOrdersProps = {
  isActiveTab: boolean
  keyword: string
}

export const EmptyOrders = ({ isActiveTab, keyword }: EmptyOrdersProps) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-sm font-medium text-subText">
    <NoDataIcon />
    <span>
      {keyword ? (
        <Trans>No orders found.</Trans>
      ) : isActiveTab ? (
        <Trans>You don&apos;t have any open orders yet.</Trans>
      ) : (
        <Trans>You don&apos;t have any order history.</Trans>
      )}
    </span>
  </div>
)

// Components used by OrderRow

export const MOBILE_STATUS_LAYOUT = {
  ACTIVE: 'active',
  HISTORY: 'history',
} as const

type MobileStatusLayout = (typeof MOBILE_STATUS_LAYOUT)[keyof typeof MOBILE_STATUS_LAYOUT]

type RateCellProps = {
  rate: string
  makerSymbol: string
  takerSymbol: string
}

export const RateCell = ({ rate, makerSymbol, takerSymbol }: RateCellProps) => {
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

type StatusPillProps = {
  status: LimitOrderStatus
  warning?: boolean
  className?: string
}

const StatusPill = ({ status, warning, className }: StatusPillProps) => {
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

type TokenAmountLineProps = {
  amount: string
  logo: string
  symbol: string
  prefix: '+' | '-'
  muted?: boolean
}

export const TokenAmountLine = ({ amount, logo, symbol, prefix, muted }: TokenAmountLineProps) => (
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

export const SizeCell = ({
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

type AvailableCellProps = {
  amount?: string
  symbol?: string
  muted?: boolean
}

export const AvailableCell = ({ amount, symbol, muted }: AvailableCellProps) => (
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

type StatusCellProps = {
  filledPercent: string
  filledProgressPercent: number
  status: LimitOrderStatus
  warning?: boolean
  mobileLayout: MobileStatusLayout
}

export const StatusCell = ({
  filledPercent,
  filledProgressPercent,
  status,
  warning,
  mobileLayout,
}: StatusCellProps) => {
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
