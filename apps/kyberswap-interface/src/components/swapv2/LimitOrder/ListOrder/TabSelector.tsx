import { Trans } from '@lingui/macro'

import { LimitOrderStatus } from 'components/swapv2/LimitOrder/types'
import { cn } from 'utils/cn'

const LIST_ORDER_TABS = [{ id: LimitOrderStatus.ACTIVE }, { id: LimitOrderStatus.CLOSED }] as const

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => {
  return (
    <div className="flex items-stretch overflow-x-auto border-b border-darkBorder" role="tablist">
      {LIST_ORDER_TABS.map((tab, index) => {
        const active = tab.id === activeTab
        const isLast = index === LIST_ORDER_TABS.length - 1
        return (
          <button
            key={tab.id}
            aria-selected={active}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
            className={cn(
              'relative flex shrink-0 cursor-pointer items-center gap-1.5 border-0 px-4 py-3 text-sm font-medium',
              !isLast && 'border-r border-darkBorder',
              active
                ? 'bg-transparent text-primary hover:bg-transparent hover:text-primary'
                : 'bg-transparent text-subText hover:bg-transparent hover:text-text',
            )}
          >
            {tab.id === LimitOrderStatus.ACTIVE ? <Trans>Active Orders</Trans> : <Trans>Order History</Trans>}
          </button>
        )
      })}
    </div>
  )
}
export default TabSelector
