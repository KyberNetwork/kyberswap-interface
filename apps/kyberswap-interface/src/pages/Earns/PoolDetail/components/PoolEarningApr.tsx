import { rgba } from 'polished'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { formatAprValue } from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { MEDIA_WIDTHS } from 'theme'

type RewardProgram = {
  icon?: string
  label: string
  value: number
}

const BaselineRow = styled(HStack)`
  align-items: baseline;
  gap: 6px;
`

const AprBadge = styled(Stack)`
  background: ${({ theme }) => rgba(theme.primary, 0.12)};
  border-radius: 12px;
  padding: 4px 12px;
`

const RewardBadge = styled(HStack)`
  align-items: center;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 999px;
  gap: 8px;
  padding: 6px 8px;
`

const PoolEarningApr = () => {
  const theme = useTheme()
  const { dexInfo, pool } = usePoolDetailContext()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const aprSummary = useMemo(() => {
    const totalApr = pool.poolStats?.apr ?? 0
    const egApr = pool.poolStats?.kemEGApr ?? 0
    const lmApr = pool.poolStats?.kemLMApr ?? 0
    const bonusApr = pool.poolStats?.bonusApr ?? 0
    const rewardApr = egApr + lmApr + bonusApr
    const feeApr = pool.poolStats?.lpApr7d ?? totalApr - rewardApr

    const rewardPrograms: RewardProgram[] = []
    if (lmApr > 0) {
      rewardPrograms.push({
        icon: dexInfo.logo,
        label: dexInfo.name,
        value: lmApr,
      })
    }
    if (bonusApr > 0 && pool.merklOpportunity) {
      rewardPrograms.push({
        icon: pool.merklOpportunity.protocol.icon,
        label: pool.merklOpportunity.protocol.name,
        value: pool.merklOpportunity.apr,
      })
    }
    return {
      activeApr: pool.poolStats?.activeApr,
      totalApr,
      feeApr,
      rewardApr,
      rewardPrograms,
    }
  }, [dexInfo.logo, dexInfo.name, pool])

  const hasActiveApr = aprSummary?.activeApr !== undefined

  return (
    <HStack align="stretch" gap={12} wrap="wrap">
      <Stack alignItems="center" flex="0 0 auto" gap={8} px={12}>
        <Text color={theme.text} fontSize={14} fontWeight={500}>
          {hasActiveApr ? 'Active APR' : 'APR'}
        </Text>
        <AprBadge>
          <Text color={theme.primary} fontSize={24} fontWeight={600}>
            {formatAprValue(hasActiveApr ? aprSummary.activeApr : aprSummary.totalApr)}
          </Text>
        </AprBadge>
      </Stack>

      {!upToSmall && <Box backgroundColor={rgba(theme.text, 0.08)} width="1px" />}

      <Stack flex="1 1 320px" gap={8} justify="flex-start" px={12}>
        <HStack align="baseline" gap="12px 24px" wrap="wrap">
          {hasActiveApr && (
            <BaselineRow>
              <Text color={theme.subText} fontSize={14}>
                APR
              </Text>
              <Text color={theme.text} fontWeight={500}>
                {formatAprValue(aprSummary.totalApr)}
              </Text>
            </BaselineRow>
          )}

          <BaselineRow>
            <Text color={theme.subText} fontSize={14}>
              Fee
            </Text>
            <Text color={theme.text} fontWeight={500}>
              {formatAprValue(aprSummary.feeApr)}
            </Text>
          </BaselineRow>
        </HStack>

        <HStack align="center" gap="12px 24px" wrap="wrap">
          <BaselineRow>
            <Text color={theme.subText} fontSize={14}>
              Rewards
            </Text>
            <Text color={theme.text} fontWeight={500}>
              {formatAprValue(aprSummary.rewardApr)}
            </Text>
          </BaselineRow>

          {aprSummary.rewardPrograms.length > 0 && (
            <HStack gap={16} wrap="wrap">
              {aprSummary.rewardPrograms.map((item, index) => (
                <RewardBadge key={index}>
                  {item.icon ? <TokenLogo size={16} src={item.icon} /> : null}
                  <Text color={theme.subText} fontSize={14}>
                    {item.label}
                  </Text>
                  <Text color={theme.text} fontSize={14} fontWeight={500}>
                    {formatAprValue(item.value)}
                  </Text>
                </RewardBadge>
              ))}
            </HStack>
          )}
        </HStack>
      </Stack>
    </HStack>
  )
}

export default PoolEarningApr
