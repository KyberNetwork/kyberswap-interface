import { t } from '@lingui/macro'
import { Flex } from 'rebass'

import TabButton from 'components/TabButton'

import { LimitOrderStatus } from '../type'

const TabSelector = ({
  className,
  activeTab,
  setActiveTab,
}: {
  className?: string
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => {
  const style = { padding: '16px', flex: 'unset', fontSize: '14px', height: 'unset' }
  return (
    <Flex className={className} sx={{ borderTopLeftRadius: '20px', overflow: 'hidden' }}>
      <TabButton
        style={style}
        active={activeTab === LimitOrderStatus.ACTIVE}
        onClick={() => {
          setActiveTab(LimitOrderStatus.ACTIVE)
        }}
        text={t`Active Orders`}
      />
      <TabButton
        style={style}
        active={activeTab === LimitOrderStatus.CLOSED}
        text={t`Order History`}
        onClick={() => {
          setActiveTab(LimitOrderStatus.CLOSED)
        }}
      />
    </Flex>
  )
}
export default TabSelector
