import { rgba } from 'polished'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatAprValue } from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const AprBadge = styled(Stack)`
  background: ${({ theme }) => rgba(theme.primary, 0.12)};
  border-radius: 12px;
  padding: 4px 12px;
`

const ActiveAprBadge = styled(AprBadge)`
  background: ${({ theme }) => rgba(theme.blue, 0.12)};
`

const AprSection = styled(HStack)`
  align-items: center;
  gap: 24px;
  flex: 1 1 320px;
`

const SectionDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: ${({ theme }) => rgba(theme.text, 0.08)};
`

const ValueColumn = styled(Stack)`
  gap: 8px;
`

const BaselineRow = styled(HStack)`
  align-items: baseline;
  gap: 8px;
`

const PoolEarningApr = () => {
  const theme = useTheme()
  const { pool } = usePoolDetailContext()

  const aprSummary = useMemo(() => {
    const totalApr = pool.poolStats?.allApr24h ?? 0
    const feeApr = pool.poolStats?.lpApr24h ?? 0
    const rewardApr = Math.max(totalApr - feeApr, 0)

    const bonusApr = pool.poolStats?.bonusApr ?? 0
    const activeApr = pool.poolStats?.activeApr !== undefined ? pool.poolStats.activeApr + bonusApr : undefined
    const activeFeeApr = pool.poolStats?.activeFeeApr ?? 0
    const activeRewardApr = activeApr !== undefined ? Math.max(activeApr - activeFeeApr, 0) : undefined

    return {
      totalApr,
      feeApr,
      rewardApr,
      activeApr,
      activeFeeApr,
      activeRewardApr,
    }
  }, [pool])

  const hasActiveApr = aprSummary?.activeApr !== undefined

  return (
    <HStack align="stretch" gap={12} wrap="wrap">
      <AprSection>
        <Stack align="center" flex="0 0 128px" gap={8}>
          <HStack align="center" gap={4}>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              APR
            </Text>
            <InfoHelper text="Earning Per Total TVL" size={14} placement="top" />
          </HStack>
          <AprBadge>
            <Text color={theme.primary} fontSize={24} fontWeight={600}>
              {formatAprValue(aprSummary.totalApr)}
            </Text>
          </AprBadge>
        </Stack>

        <SectionDivider />

        <ValueColumn>
          <BaselineRow>
            <Text color={theme.subText} fontSize={14}>
              Fee
            </Text>
            <Text color={theme.text} fontWeight={500}>
              {formatAprValue(aprSummary.feeApr)}
            </Text>
          </BaselineRow>
          <BaselineRow>
            <Text color={theme.subText} fontSize={14}>
              Rewards
            </Text>
            <Text color={theme.text} fontWeight={500}>
              {formatAprValue(aprSummary.rewardApr)}
            </Text>
          </BaselineRow>
        </ValueColumn>
      </AprSection>

      {hasActiveApr ? (
        <AprSection>
          <Stack align="center" flex="0 0 128px" gap={8}>
            <HStack align="center" gap={4}>
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                Active APR
              </Text>
              <InfoHelper text="Earning Per Active TVL" size={14} placement="top" />
            </HStack>
            <ActiveAprBadge>
              <Text color={theme.blue} fontSize={24} fontWeight={600}>
                {formatAprValue(aprSummary.activeApr)}
              </Text>
            </ActiveAprBadge>
          </Stack>

          <SectionDivider />

          <ValueColumn>
            <BaselineRow>
              <Text color={theme.subText} fontSize={14}>
                Fee
              </Text>
              <Text color={theme.text} fontWeight={500}>
                {formatAprValue(aprSummary.activeFeeApr)}
              </Text>
            </BaselineRow>
            <BaselineRow>
              <Text color={theme.subText} fontSize={14}>
                Rewards
              </Text>
              <Text color={theme.text} fontWeight={500}>
                {formatAprValue(aprSummary.activeRewardApr)}
              </Text>
            </BaselineRow>
          </ValueColumn>
        </AprSection>
      ) : null}
    </HStack>
  )
}

export default PoolEarningApr
