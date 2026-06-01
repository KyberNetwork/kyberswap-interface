import { ReactComponent as AnalyticsIcon } from 'assets/svg/earn/ic_analytics.svg'
import { ReactComponent as BagIcon } from 'assets/svg/earn/ic_bag.svg'
import { Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import { cn } from 'utils/cn'

import AnalyticsTab from './AnalyticsTab'
import EarningsTab from './EarningsTab'
import InformationTab from './InformationTab'

const POOL_INFO_TABS = [
  { id: 'information', label: 'INFORMATION', Icon: null },
  { id: 'earnings', label: 'EARNING(S)', Icon: BagIcon },
  { id: 'analytics', label: 'ANALYTICS', Icon: AnalyticsIcon },
] as const

type PoolInfoTab = (typeof POOL_INFO_TABS)[number]['id']

const PoolInformation = () => {
  const { activeTab, setActiveTab } = useTab<PoolInfoTab>({
    tabs: POOL_INFO_TABS.map(tab => tab.id),
    defaultTab: 'information',
  })
  const currentTab: PoolInfoTab = activeTab || 'information'

  return (
    <Stack className="w-full overflow-hidden rounded-xl bg-background">
      <div className="flex items-stretch overflow-x-auto border-b border-solid border-darkBorder" role="tablist">
        {POOL_INFO_TABS.map((tab, index) => {
          const active = tab.id === currentTab
          const isLast = index === POOL_INFO_TABS.length - 1
          return (
            <button
              key={tab.id}
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
              className={cn(
                'relative flex shrink-0 grow-0 cursor-pointer items-center gap-1 border-0 p-4 text-sm font-medium tracking-[0.04em]',
                !isLast && 'border-r border-solid border-darkBorder',
                active
                  ? 'bg-primary-12 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-12'
                  : 'bg-transparent text-subText hover:bg-tableHeader hover:text-text',
              )}
            >
              {tab.Icon ? <tab.Icon width={18} height={18} /> : null}
              {tab.label}
            </button>
          )
        })}
      </div>

      <Stack className="px-4 pb-4 pt-5 max-sm:p-4">
        {currentTab === 'information' && <InformationTab />}
        {currentTab === 'earnings' && <EarningsTab />}
        {currentTab === 'analytics' && <AnalyticsTab />}
      </Stack>
    </Stack>
  )
}

export default PoolInformation
