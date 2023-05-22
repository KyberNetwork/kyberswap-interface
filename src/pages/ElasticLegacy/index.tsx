import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { PoolElasticIcon } from 'components/Icons'
import LocalLoader from 'components/LocalLoader'
import { PageWrapper } from 'components/YieldPools/styleds'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'

import FarmLegacy from './FarmLegacy'
import PositionLegacy from './PositionLegacy'

const Tab = styled.div<{ active: boolean }>`
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.3) : 'transparent')};
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  border: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
`

export default function ElasticLegacy() {
  const { loading, positions, farmPositions } = useElasticLegacy()
  const { loading: loadingCompensationData, data: farmRewardData, claimInfo } = useElasticCompensationData()
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length || !!farmPositions.length

  const theme = useTheme()
  const [tab, setTab] = useState<'farm' | 'position'>('farm')

  useEffect(() => {
    if (!shouldShowFarmTab && shouldShowPositionTab) setTab('position')
  }, [shouldShowPositionTab, shouldShowFarmTab])

  if (loading || loadingCompensationData) {
    return <LocalLoader />
  }

  return (
    <PageWrapper>
      <Flex sx={{ gap: '6px' }} alignItems="center">
        <PoolElasticIcon size={20} color={theme.text} />
        <Text fontSize="24px" fontWeight="500">
          Elastic Legacy
        </Text>
      </Flex>

      <Flex sx={{ gap: '8px' }} marginTop="24px" marginBottom="1rem">
        {shouldShowFarmTab && (
          <Tab active={tab === 'farm'} role="button" onClick={() => setTab('farm')}>
            My Farms
          </Tab>
        )}
        {shouldShowPositionTab && (
          <Tab active={tab === 'position'} role="button" onClick={() => setTab('position')}>
            My Positions
          </Tab>
        )}
      </Flex>

      {tab === 'farm' && (
        <FarmLegacy
          claimInfo={claimInfo}
          farmPositions={farmPositions.map(item => {
            const reward = farmRewardData?.find(frd => frd.nftid.toString() === item.id)
            return {
              ...item,
              pendingRewards: reward?.pending_rewards || [],
            }
          })}
          pendingRewards={(farmRewardData || []).map(item => item.pending_rewards).flat()}
        />
      )}
      {tab === 'position' && <PositionLegacy positions={[...positions, ...farmPositions]} />}
    </PageWrapper>
  )
}
