import { t } from '@lingui/macro'
import { Flex } from 'rebass'

import TabButton from 'components/TabButton'

import { LimitOrderTab } from '../type'

export default function TabSelector({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderTab
  setActiveTab: (n: LimitOrderTab) => void
}) {
  const style = { padding: '16px', flex: 'unset', fontSize: '14px' }

  return (
    <Flex sx={{ borderTopLeftRadius: '19px', overflow: 'hidden' }}>
      <TabButton
        style={style}
        active={activeTab === LimitOrderTab.ORDER_BOOK}
        onClick={() => setActiveTab(LimitOrderTab.ORDER_BOOK)}
        text={t`Open Limit Orders`}
      />
      <TabButton
        style={style}
        active={activeTab === LimitOrderTab.MY_ORDER}
        text={t`My Order(s)`}
        onClick={() => setActiveTab(LimitOrderTab.MY_ORDER)}
      />
    </Flex>
  )
}
