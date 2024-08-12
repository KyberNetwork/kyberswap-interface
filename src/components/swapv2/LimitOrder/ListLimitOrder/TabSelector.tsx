import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import TabButton from 'components/TabButton'
import { MEDIA_WIDTHS } from 'theme'

import { LimitOrderTab } from '../type'

export default function TabSelector({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderTab
  setActiveTab: (n: LimitOrderTab) => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const style = useMemo(
    () => ({ padding: '16px', flex: 'unset', fontSize: '14px', width: upToSmall ? '50%' : 'fit-content' }),
    [upToSmall],
  )

  return (
    <Flex
      sx={{
        borderTopLeftRadius: upToSmall ? 0 : '19px',
        overflow: 'hidden',
        width: upToSmall ? '100%' : 'fit-content',
      }}
    >
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
