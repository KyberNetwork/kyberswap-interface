import { t } from '@lingui/macro'

import { cn } from 'utils/cn'

import { LimitOrderStatus } from '../type'

const TabButton = ({ active, ...props }: { active: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      'cursor-pointer text-sm leading-5 transition-all duration-200 ease-linear',
      active ? 'text-primary' : 'text-subText hover:brightness-[1.2]',
    )}
  />
)

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => {
  return (
    <div className="flex items-center gap-2 p-4">
      <TabButton active={activeTab === LimitOrderStatus.ACTIVE} onClick={() => setActiveTab(LimitOrderStatus.ACTIVE)}>
        {t`Active Orders`}
      </TabButton>

      <span className="text-subText">|</span>

      <TabButton active={activeTab === LimitOrderStatus.CLOSED} onClick={() => setActiveTab(LimitOrderStatus.CLOSED)}>
        {t`Order History`}
      </TabButton>
    </div>
  )
}
export default TabSelector
