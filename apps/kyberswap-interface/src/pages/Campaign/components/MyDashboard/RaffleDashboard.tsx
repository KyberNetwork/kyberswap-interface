import { Trans } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { useMedia } from 'react-use'
import { useGetRaffleCampaignParticipantQuery, useGetRaffleCampaignStatsQuery } from 'services/campaignRaffle'

import Divider from 'components/Divider'
import { useWeb3React } from 'hooks'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function RaffleDashboard() {
  const { account } = useWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { reward, weeks: configWeeks } = campaignConfig[CampaignType.Raffle]

  const { data: campaignStats } = useGetRaffleCampaignStatsQuery()
  const { data: participant } = useGetRaffleCampaignParticipantQuery({ address: account || '' }, { skip: !account })

  const weeks = useMemo(() => {
    if (configWeeks.length > 0) return configWeeks
    return campaignStats?.weeks ?? []
  }, [configWeeks, campaignStats])

  const rewaredWeek = useMemo(() => {
    if (participant?.reward_week_1 && participant.reward_week_2) return '1 & 2'
    if (participant?.reward_week_1) return '1'
    if (participant?.reward_week_2) return '2'
    return null
  }, [participant])

  return (
    <div className="mt-5 rounded-[20px] bg-background p-6">
      <div className="mb-6 flex flex-wrap gap-y-4" style={{ columnGap: '4rem' }}>
        <div className="min-w-[120px]">
          <span className="text-subText">
            <Trans>Total Wins</Trans>
          </span>
          <div className="mt-2 flex items-center gap-2">
            <img src={reward.logo} alt={reward.symbol} width="20px" height="20px" style={{ borderRadius: '50%' }} />
            <span className="text-lg font-medium text-text">
              {formatDisplayNumber(participant?.reward_all, { significantDigits: 6, fallback: '0' })} {reward.symbol}
            </span>
          </div>
        </div>

        {!!participant?.reward_all && (
          <div className="min-w-[280px] flex-1">
            <span className="text-subText">
              <Trans>
                You&apos;ve eligible for Week {rewaredWeek} &quot;Swap For An Opportunity&quot; Campaign Rewards 🎁
              </Trans>
            </span>
            <p className="mt-2 text-sm text-subText">
              <Trans>Rewards will be sent directly to your wallet by Dec 12, 2025 on Base.</Trans>
            </p>
          </div>
        )}
      </div>

      <Divider />

      {!upToSmall && (
        <>
          <div className="flex py-4 text-xs font-medium text-subText">
            <span className="flex-1">
              <Trans>WEEK</Trans>
            </span>
            <span className="flex-1 text-right">
              <Trans>ELIGIBLE TRANSACTIONS</Trans>
            </span>
            <span className="flex-1 text-right">
              <Trans>REWARDS</Trans>
            </span>
          </div>
          <Divider />
        </>
      )}

      {upToSmall ? (
        <div className="flex flex-col gap-4 py-4 text-sm font-medium text-subText">
          <WeekRewardLine
            title={weeks[0]?.label}
            txCount={participant?.tx_count_week_1}
            reward={participant?.reward_week_1}
          />
          <Divider />
          <WeekRewardLine
            title={weeks[1]?.label}
            txCount={participant?.tx_count_week_2}
            reward={participant?.reward_week_2}
          />
        </div>
      ) : (
        <>
          <WeekRewardLine
            title={weeks[0]?.label}
            txCount={participant?.tx_count_week_1}
            reward={participant?.reward_week_1}
          />
          <WeekRewardLine
            title={weeks[1]?.label}
            txCount={participant?.tx_count_week_2}
            reward={participant?.reward_week_2}
          />
        </>
      )}
    </div>
  )
}

const WeekRewardLine = ({ title, txCount, reward }: { title: ReactNode; txCount?: number; reward?: number }) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return upToSmall ? (
    <div className="flex flex-col gap-4">
      <span className="flex-1">{title}</span>
      <div className="flex justify-between">
        <span className="flex-1">ELIGIBLE TRANSACTIONS</span>
        <span className="text-base text-white">{formatDisplayNumber(txCount, { significantDigits: 6 })}</span>
      </div>
      <div className="flex justify-between">
        <span className="flex-1">REWARDS</span>
        <span className="text-base text-white">
          {formatDisplayNumber(reward, { significantDigits: 6 })} {!!reward && 'KNC'}
        </span>
      </div>
    </div>
  ) : (
    <div className="flex py-4 text-sm font-medium text-subText">
      <span className="flex-1">{title}</span>
      <span className="flex-1 text-right text-white">{formatDisplayNumber(txCount, { significantDigits: 6 })}</span>
      <span className="flex-1 text-right text-white">
        {formatDisplayNumber(reward, { significantDigits: 6 })} {!!reward && 'KNC'}
      </span>
    </div>
  )
}
