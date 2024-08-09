import { t } from '@lingui/macro'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import useTheme from 'hooks/useTheme'

import { LimitOrderStatus } from '../type'

const TabButton = styled.div<{ active: boolean }>`
  font-size: 14px;
  line-height: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
        `
      : css`
          color: ${theme.subText};
          :hover {
            filter: brightness(1.2);
          }
        `}
`

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => {
  const theme = useTheme()

  return (
    <Flex alignItems={'center'} sx={{ padding: 16, gap: '8px' }}>
      <TabButton active={activeTab === LimitOrderStatus.ACTIVE} onClick={() => setActiveTab(LimitOrderStatus.ACTIVE)}>
        {t`Active Orders`}
      </TabButton>

      <span style={{ color: theme.subText }}>|</span>

      <TabButton active={activeTab === LimitOrderStatus.CLOSED} onClick={() => setActiveTab(LimitOrderStatus.CLOSED)}>
        {t`Order History`}
      </TabButton>
    </Flex>
  )
}
export default TabSelector
