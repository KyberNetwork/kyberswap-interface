import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { SafePalCampaignWeekStats, useGetSafePalCampaignWeeklyStatsQuery } from 'services/campaignSafepal'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import SafePalClaimModal from 'pages/Campaign/components/SafePalClaimModal'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { safepalClaimWeeks } from 'pages/Campaign/timelines'
import {
  findActiveCampaignWeek,
  findCampaignWeekByValue,
  getCampaignRangeBounds,
  getCampaignWeekNumber,
  isCampaignWeekEnded,
  isSafePalCampaignWinner,
} from 'pages/Campaign/utils/safepalUtils'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 120px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 1rem 0;
  gap: 1rem;
  font-weight: 500;
`

const TableRow = styled(TableHeader)`
  font-size: 1rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  align-items: center;
`

const SummaryDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const StatusBadge = styled.div<{ $isWinner: boolean }>`
  background-color: ${({ theme, $isWinner }) => rgba($isWinner ? theme.primary : theme.subText, 0.16)};
  border-radius: 999px;
  color: ${({ theme, $isWinner }) => ($isWinner ? theme.primary : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  min-width: 120px;
  padding: 8px 12px;
  text-align: center;
`

const formatClaimDeadline = (timestamp: number) =>
  dayjs(timestamp * 1000)
    .utc()
    .format('DD/MM/YYYY HH:mm') + ' UTC'

const formatCountValue = (value?: number) => {
  return value !== undefined ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'
}

const formatWeekLabel = (item: SafePalCampaignWeekStats) => {
  const start = dayjs(item.cycle_start)
  const end = dayjs(item.cycle_end)
  const week = item.cycle

  if (!start.isValid() || !end.isValid()) return t`Week ${week}`
  return `Week ${week} ${start.format('MMM DD')} - ${end.format('MMM DD')}`
}

export default function SafePalDashboard() {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useWeb3React()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

  const { weeks } = campaignConfig[CampaignType.SafePal]
  const dashboardRange = useMemo(() => getCampaignRangeBounds(weeks), [weeks])

  const { data, isLoading } = useGetSafePalCampaignWeeklyStatsQuery(
    { address: account || ZERO_ADDRESS, ...dashboardRange },
    { skip: !account, pollingInterval: 30_000 },
  )

  const weekItems = useMemo(() => {
    const items = data?.items || []
    return [...items].sort((a, b) => b.cycle - a.cycle)
  }, [data?.items])

  const winnerWeeks = useMemo(
    () =>
      weekItems.filter(item => {
        const weekRange = findCampaignWeekByValue(weeks, item.cycle)
        return isCampaignWeekEnded(weekRange) && isSafePalCampaignWinner(item)
      }),
    [weekItems, weeks],
  )
  const totalWinWeeks = winnerWeeks.length

  const currentClaimWeek = findActiveCampaignWeek(safepalClaimWeeks)
  const currentClaimWeekNumber = getCampaignWeekNumber(weeks, currentClaimWeek?.value)

  const isCurrentClaimWeekWinner = useMemo(() => {
    const claimWeekItem = weekItems.find(item => item.cycle === currentClaimWeek?.value)
    return isSafePalCampaignWinner(claimWeekItem)
  }, [currentClaimWeek, weekItems])

  return (
    <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
      {!account ? (
        <Text textAlign="center" color={theme.subText}>
          <Trans>Please connect wallet to view your Dashboard</Trans>
        </Text>
      ) : isLoading ? (
        <LocalLoader />
      ) : (
        <>
          <Flex
            justifyContent="flex-start"
            alignItems={upToSmall ? 'flex-start' : 'center'}
            flexDirection={upToSmall ? 'column' : 'row'}
            sx={{ gap: '1rem' }}
            mb="20px"
          >
            <Flex alignItems={upToSmall ? 'flex-start' : 'center'} sx={{ gap: '1.5rem' }} flex={1} flexWrap="wrap">
              <Box minWidth={140}>
                <Text color={theme.subText}>
                  <Trans>Total Wins</Trans>
                </Text>
                <Text marginTop="8px" fontSize={18} fontWeight="500" color={theme.text}>
                  {totalWinWeeks} <Trans>Weeks</Trans>
                </Text>
              </Box>

              {currentClaimWeek && (
                <>
                  <SummaryDivider />

                  <Box flex={1} minWidth={260}>
                    <Text color={theme.text} fontSize={upToSmall ? 15 : 16}>
                      {isCurrentClaimWeekWinner ? (
                        <Trans>
                          You&apos;ve won 🎁 SafePal X1 Hardware Wallet in Week {currentClaimWeekNumber} SafePal
                          Campaign.
                        </Trans>
                      ) : (
                        <Trans>Trade to enter Top 667 and become a Winner in the SafePal Campaign.</Trans>
                      )}
                    </Text>
                    <Text color={theme.subText} fontStyle="italic" marginTop="6px" fontSize={14}>
                      {isCurrentClaimWeekWinner ? (
                        <Trans>Claim deadline: {formatClaimDeadline(currentClaimWeek.end)}</Trans>
                      ) : (
                        <Trans>Top 667 each week are marked as Winner.</Trans>
                      )}
                    </Text>
                  </Box>
                  {isCurrentClaimWeekWinner && (
                    <ButtonPrimary
                      width="fit-content"
                      padding="8px 16px"
                      altDisabledStyle
                      onClick={() => setIsClaimModalOpen(true)}
                    >
                      <Trans>Claim Now</Trans>
                    </ButtonPrimary>
                  )}
                  {isCurrentClaimWeekWinner && (
                    <SafePalClaimModal
                      isOpen={isClaimModalOpen}
                      onDismiss={() => setIsClaimModalOpen(false)}
                      claimWeek={currentClaimWeek}
                    />
                  )}
                </>
              )}
            </Flex>
          </Flex>

          <Divider />

          {!upToSmall && (
            <>
              <TableHeader>
                <Text>
                  <Trans>WEEK</Trans>
                </Text>
                <Text textAlign="right">
                  <Trans>ELIGIBLE TRANSACTIONS</Trans>
                </Text>
                <Text textAlign="right">
                  <Trans>POINTS</Trans>
                </Text>
                <Text textAlign="center">
                  <Trans>STATUS</Trans>
                </Text>
              </TableHeader>
              <Divider />
            </>
          )}

          {!weekItems.length ? (
            <Text textAlign="center" color={theme.subText} mt="24px">
              <Trans>No data found</Trans>
            </Text>
          ) : upToSmall ? (
            weekItems.map(item => {
              const hasStatus = isCampaignWeekEnded(findCampaignWeekByValue(weeks, item.cycle))
              const winner = isSafePalCampaignWinner(item)

              return (
                <Box key={item.cycle} paddingY="1rem" sx={{ borderBottom: `1px solid ${theme.border}` }}>
                  <Text color={theme.text} fontSize={18} fontWeight={500}>
                    {formatWeekLabel(item)}
                  </Text>

                  <Flex justifyContent="space-between" alignItems="center" mt="1rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      <Trans>ELIGIBLE TRANSACTIONS</Trans>
                    </Text>
                    <Text>{formatCountValue(item.cycle_eligible_tx)}</Text>
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="0.75rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      <Trans>POINTS</Trans>
                    </Text>
                    <Text>{item.total_points}</Text>
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="0.75rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      <Trans>STATUS</Trans>
                    </Text>
                    {hasStatus ? (
                      <StatusBadge $isWinner={winner}>{winner ? t`Winner` : t`Not a winner`}</StatusBadge>
                    ) : (
                      <Text color={theme.subText}>--</Text>
                    )}
                  </Flex>
                </Box>
              )
            })
          ) : (
            weekItems.map(item => {
              const hasStatus = isCampaignWeekEnded(findCampaignWeekByValue(weeks, item.cycle))
              const winner = isSafePalCampaignWinner(item)

              return (
                <TableRow key={item.cycle}>
                  <Text color={theme.subText}>{formatWeekLabel(item)}</Text>
                  <Text textAlign="right">{formatCountValue(item.cycle_eligible_tx)}</Text>
                  <Text textAlign="right">{item.total_points}</Text>
                  <Flex justifyContent="center">
                    {hasStatus ? (
                      <StatusBadge $isWinner={winner}>{winner ? t`Winner` : t`Not a winner`}</StatusBadge>
                    ) : (
                      '--'
                    )}
                  </Flex>
                </TableRow>
              )
            })
          )}
        </>
      )}
    </Box>
  )
}
