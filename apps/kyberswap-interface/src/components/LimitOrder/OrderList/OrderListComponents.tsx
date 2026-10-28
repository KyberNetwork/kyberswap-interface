import { Trans } from '@lingui/macro'
import { HTMLAttributes, ReactNode, Ref } from 'react'

import { OrderKind } from 'components/LimitOrder/types'
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
  onChange: (kind: OrderKind) => void
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
