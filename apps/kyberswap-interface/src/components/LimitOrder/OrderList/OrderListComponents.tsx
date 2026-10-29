import { Trans } from '@lingui/macro'
import { HTMLAttributes, ReactNode, Ref } from 'react'
import { Trash } from 'react-feather'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { OrderKind } from 'components/LimitOrder/types'
import Loader from 'components/Loader'
import SearchInput from 'components/SearchInput'
import SegmentedControl from 'components/SegmentedControl'
import { HStack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'

type OrderPanelCardProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>
}

export const OrderPanelCard = ({ className, ...props }: OrderPanelCardProps) => (
  <div
    {...props}
    className={cn(
      'flex w-full flex-col gap-0 overflow-hidden rounded-xl border border-darkBorder max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none',
      className,
    )}
  />
)

/** The loaded panel and its fallback share the control height, padding and wrapping. */
export const OrderListToolbar = ({ children }: { children: ReactNode }) => (
  <HStack className="flex-wrap items-center justify-between gap-3 border-b border-darkBorder px-4 py-3">
    {children}
  </HStack>
)

type CancelAllButtonProps = {
  disabled?: boolean
  /** The open orders it would cancel are still being fetched. */
  isLoading?: boolean
  onClick: () => void
  dataTestId?: string
}

/** The one Cancel All button, which the limit and the stop market order lists both offer. */
export const CancelAllButton = ({ disabled, isLoading, onClick, dataTestId }: CancelAllButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    data-testid={dataTestId}
    className="flex w-fit animate-[fadeIn_0.2s_ease-out_both] cursor-pointer items-center gap-1.5 rounded-[16px] border border-tabActive bg-white-08 px-3 py-1 text-sm font-medium text-subText transition-colors hover:text-text disabled:cursor-default disabled:opacity-50 disabled:hover:text-subText motion-reduce:animate-none"
  >
    {isLoading ? <Loader size="14px" /> : <Trash size={14} />}
    <Trans>Cancel All</Trans>
  </button>
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

/** Both tables keep details mounted for collapse; hidden links must not receive keyboard focus. */
export const OrderRowDetails = ({ expanded, children }: { expanded: boolean; children: ReactNode }) => (
  <div
    inert={!expanded}
    className={cn(
      'grid bg-white/[0.02] transition-[grid-template-rows,opacity] duration-200 ease-in-out max-sm:hidden',
      expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
    )}
  >
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
)

type OrderListFiltersProps = {
  children: ReactNode
  searchValue: string
  searchPlaceholder: string
  searchDataTestId?: string
  onSearchChange: (value: string) => void
}

/** Preserve Limit's transparent filter bar; dropdowns and search own their backgrounds. */
export const OrderListFilters = ({
  children,
  searchValue,
  searchPlaceholder,
  searchDataTestId,
  onSearchChange,
}: OrderListFiltersProps) => (
  <div className="flex justify-between gap-2 px-4 py-2 max-sm:flex-col">
    <div className="flex min-w-0 items-center gap-2 max-sm:w-full">{children}</div>
    <SearchInput
      className="h-9 min-h-9 max-w-[280px] flex-1 rounded-[40px] py-1 max-sm:w-full max-sm:max-w-none max-sm:flex-none"
      dataTestId={searchDataTestId}
      maxLength={255}
      onChange={onSearchChange}
      placeholder={searchPlaceholder}
      value={searchValue}
    />
  </div>
)

export type PanelTab<T extends string> = { id: T; label: ReactNode }

type PanelTabsProps<T extends string> = {
  tabs: PanelTab<T>[]
  activeTab: T
  dataTestId: string
  /** Controls for the whole card, at the far end of the bar. */
  rightSlot?: ReactNode
  onChange: (tab: T) => void
}

const PanelTabs = <T extends string>({ tabs, activeTab, dataTestId, rightSlot, onChange }: PanelTabsProps<T>) => (
  <HStack className="items-center gap-3 bg-background pr-4">
    <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist" data-testid={dataTestId}>
      {tabs.map((tab, index) => {
        const active = tab.id === activeTab
        const isLast = index === tabs.length - 1

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`${dataTestId}-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex min-h-11 shrink-0 cursor-pointer items-center gap-1 border-0 px-4 py-3 text-sm font-medium',
              !isLast && 'border-r border-darkBorder',
              active
                ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
            )}
          >
            <span className="flex items-center gap-1.5 text-base font-medium leading-[normal]">{tab.label}</span>
          </button>
        )
      })}
    </div>
    {rightSlot}
  </HStack>
)

type OrderKindTabsProps = {
  showStopMarkets: boolean
  kind: OrderKind
  /** Open orders by kind, or nothing to show none. */
  counts?: { limit: number; stop: number }
  insufficientFundOrders: number
  stopMarketWarning: boolean
  /** Omitted in the code-loading fallback, where the same tabs are disabled. */
  onChange?: (kind: OrderKind) => void
}

export const OrderKindTabs = ({
  showStopMarkets,
  kind,
  counts,
  insufficientFundOrders,
  stopMarketWarning,
  onChange,
}: OrderKindTabsProps) => {
  const tabs = [
    { id: OrderKind.LIMIT, label: <Trans>Limit Order</Trans>, count: counts?.limit },
    ...(showStopMarkets ? [{ id: OrderKind.STOP, label: <Trans>Stop Market</Trans>, count: counts?.stop }] : []),
  ]

  return (
    <div className="shrink-0" data-testid="order-kind-tabs">
      <SegmentedControl
        color="primary"
        value={kind}
        onChange={onChange}
        options={tabs.map(tab => ({
          value: tab.id,
          dataTestId: `order-kind-tab-${tab.id}`,
          label: (
            <span className="flex w-36 items-center justify-center gap-1.5 whitespace-nowrap">
              {tab.label}
              {!!tab.count && (
                <span
                  className={cn(
                    'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none transition-colors',
                    tab.id === OrderKind.STOP && stopMarketWarning
                      ? 'bg-warning-30 text-warning'
                      : 'bg-primary-30 text-primary',
                  )}
                  data-testid={`order-kind-count-${tab.id}`}
                >
                  {tab.count}
                </span>
              )}
              {/* A live warning, not a count: shown only while some limit orders cannot be funded. */}
              {tab.id === OrderKind.LIMIT && insufficientFundOrders > 0 && (
                <MouseoverTooltip
                  placement="top"
                  text={
                    <Trans>
                      You have {insufficientFundOrders} active orders that don&apos;t have sufficient funds.
                    </Trans>
                  }
                >
                  <span
                    className="min-w-4 rounded-full bg-warning-30 px-1.5 text-xs font-medium text-warning"
                    data-testid="order-list-insufficient-funds-badge"
                  >
                    {insufficientFundOrders}
                  </span>
                </MouseoverTooltip>
              )}
            </span>
          ),
        }))}
      />
    </div>
  )
}

export default PanelTabs
