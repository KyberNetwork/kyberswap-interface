import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import CurrentChainButton from 'pages/MyEarnings/CurrentChainButton'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import { useShowMyEarningChart } from 'state/user/hooks'

const OnOff = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 2px;
  border-radius: 999px;
  cursor: pointer;
`
const Item = styled.div<{ isActive: boolean }>`
  background: ${({ theme, isActive }) => (isActive ? theme.tableHeader : 'transparent')};
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s ease;
`

const ChainSelect = () => {
  const [isShowEarningChart, toggleEarningChart] = useShowMyEarningChart()
  const theme = useTheme()
  return (
    <Flex
      alignItems="center"
      sx={{
        gap: '16px',
      }}
    >
      <Flex alignItems="center" sx={{ gap: '12px' }}>
        <Text fontSize="14px" fontWeight="500" color={theme.subText}>
          <Trans>Earning Charts</Trans>
        </Text>
        <OnOff onClick={toggleEarningChart} role="button">
          <Item isActive={isShowEarningChart}>On</Item>
          <Item isActive={!isShowEarningChart}>Off</Item>
        </OnOff>
      </Flex>
      <CurrentChainButton />
      <MultipleChainSelect />
    </Flex>
  )
}

export default ChainSelect
