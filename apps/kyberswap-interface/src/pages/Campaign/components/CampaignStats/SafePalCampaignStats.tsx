import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import {
  useGetSafePalCampaignJoinedStatsQuery,
  useGetSafePalCampaignTransactionsQuery,
  useGetSafePalCampaignUserStatsQuery,
  useGetSafePalCampaignWeeklyStatsQuery,
} from 'services/campaignSafepal'

import { ButtonPrimary } from 'components/Button'
import { MouseoverTooltip } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { WeekCountdown } from 'pages/Campaign/components/CampaignStats/WeekCountdown'
import SafePalClaimModal from 'pages/Campaign/components/SafePalClaimModal'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { StatCard } from 'pages/Campaign/styles'
import { safepalClaimWeeks } from 'pages/Campaign/timelines'
import { resolveSelectedCampaignWeek } from 'pages/Campaign/utils'
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

const formatCountValue = (value?: number) => {
  return value !== undefined ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'
}

const formatPointValue = (value?: number) => {
  if (value === undefined) return '--'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const formatClaimDeadline = (timestamp: number) =>
  dayjs(timestamp * 1000)
    .utc()
    .format('DD/MM/YYYY HH:mm') + ' UTC'

export default function SafePalCampaignStats({ selectedWeek }: { selectedWeek: number }) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()

  const { weeks } = campaignConfig[CampaignType.SafePal]
  const selectedRange = useMemo(() => resolveSelectedCampaignWeek(weeks, selectedWeek), [selectedWeek, weeks])

  const { data: transactionsData } = useGetSafePalCampaignTransactionsQuery(
    {
      address: account || ZERO_ADDRESS,
      fromTs: selectedRange?.start || 0,
      toTs: selectedRange?.end || 0,
    },
    { skip: !account || !selectedRange, pollingInterval: 30_000 },
  )

  const { data: joinedStats } = useGetSafePalCampaignJoinedStatsQuery(
    {
      fromTs: selectedRange?.start || 0,
      toTs: selectedRange?.end || 0,
    },
    { skip: !selectedRange, pollingInterval: 30_000 },
  )

  const { data: userStats } = useGetSafePalCampaignUserStatsQuery(
    {
      address: account || ZERO_ADDRESS,
      fromTs: selectedRange?.start || 0,
      toTs: selectedRange?.end || 0,
    },
    { skip: !selectedRange || !account, pollingInterval: 30_000 },
  )

  return (
    <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: upToSmall ? '1fr' : 'repeat(4, minmax(0, 1fr))' }}>
      <WeekCountdown weekOptions={weeks} selectedWeek={selectedWeek} />

      <StatCard>
        <span className="text-sm text-subText">
          <Trans>Participants</Trans>
        </span>
        <p className="mt-2 text-xl font-medium">{formatCountValue(joinedStats?.user_joinned)}</p>
      </StatCard>

      <StatCard>
        <span className="text-sm text-subText">
          <Trans>Eligible Transactions</Trans>
        </span>
        <p className="mt-2 text-xl font-medium">{formatCountValue(transactionsData?.total_valid_tx)}</p>
      </StatCard>

      <StatCard>
        <span className="text-sm text-subText">
          <Trans>Your Total Points</Trans>
        </span>
        <MouseoverTooltip
          text={
            <>
              <p>
                <Trans>Transaction Points: {formatPointValue(userStats?.base_points)}</Trans>
              </p>
              <p>
                <Trans>Bonus Points: {formatPointValue(userStats?.bonus_points)}</Trans>
              </p>
            </>
          }
          width="200px"
          placement="bottom"
        >
          <p className="mt-2 text-xl font-medium">{formatPointValue(userStats?.total_points)}</p>
        </MouseoverTooltip>
      </StatCard>
    </div>
  )
}

export const SafePalClaim = ({ selectedWeek }: { selectedWeek: number }) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const now = Math.floor(Date.now() / 1000)

  const { weeks } = campaignConfig[CampaignType.SafePal]
  const selectedRange = useMemo(() => resolveSelectedCampaignWeek(weeks, selectedWeek), [selectedWeek, weeks])
  const dashboardRange = useMemo(() => getCampaignRangeBounds(weeks), [weeks])

  const { data: weekStatsData } = useGetSafePalCampaignWeeklyStatsQuery(
    { address: account || ZERO_ADDRESS, ...dashboardRange },
    { skip: !account, pollingInterval: 30_000 },
  )
  const weekItems = useMemo(() => weekStatsData?.items ?? [], [weekStatsData?.items])
  const winnerWeekValues = useMemo(() => {
    return new Set(weekItems.filter(isSafePalCampaignWinner).map(item => item.cycle))
  }, [weekItems])
  const currentClaimWeek = findActiveCampaignWeek(safepalClaimWeeks, now)
  const selectedClaimWeek = useMemo(
    () => findCampaignWeekByValue(safepalClaimWeeks, selectedRange?.value),
    [selectedRange?.value],
  )

  const claimWindow = useMemo(() => {
    if (currentClaimWeek && winnerWeekValues.has(currentClaimWeek.value)) return currentClaimWeek
    if (selectedClaimWeek && winnerWeekValues.has(selectedClaimWeek.value)) return selectedClaimWeek
    return undefined
  }, [currentClaimWeek, selectedClaimWeek, winnerWeekValues])

  const displayWeekNumber = useMemo(() => getCampaignWeekNumber(weeks, claimWindow?.value), [claimWindow?.value, weeks])

  if (!account || !claimWindow || now < claimWindow.start) return null

  const isDeadlinePassed = isCampaignWeekEnded(claimWindow, now)

  return (
    <div
      className={`mt-4 flex items-center justify-between gap-3 px-4 py-2 ${upToSmall ? 'flex-col' : 'flex-row'}`}
      style={{
        borderRadius: '20px',
        border: '1px solid rgba(49, 203, 158, 0.28)',
        background:
          'linear-gradient(90deg, rgba(14, 77, 62, 0.55) 0%, rgba(20, 100, 82, 0.38) 55%, rgba(18, 65, 98, 0.45) 100%)',
      }}
    >
      <div>
        <p className={`text-text ${upToSmall ? 'text-[15px]' : 'text-base'}`}>
          <Trans>
            You&apos;ve won 🎁 SafePal X1 Hardware Wallet in Week {displayWeekNumber} of the SafePal Campaign.
          </Trans>
        </p>
        <p className={`mt-1 italic text-subText ${upToSmall ? 'text-[13px]' : 'text-sm'}`}>
          <Trans>Claim deadline: {formatClaimDeadline(claimWindow.end)}</Trans>
        </p>
      </div>

      <ButtonPrimary
        width="fit-content"
        padding="8px 16px"
        altDisabledStyle
        disabled={isDeadlinePassed}
        onClick={() => setIsClaimModalOpen(true)}
      >
        {isDeadlinePassed ? <Trans>Claim Ended</Trans> : <Trans>Claim Now</Trans>}
      </ButtonPrimary>

      <SafePalClaimModal
        isOpen={isClaimModalOpen}
        onDismiss={() => setIsClaimModalOpen(false)}
        claimWeek={claimWindow}
      />
    </div>
  )
}
