import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { ReactComponent as RewardIcon } from 'assets/svg/earn/ic_bag.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { getParsedRewardAmount } from 'pages/Earns/PoolDetail/components/utils'
import { Badge } from 'pages/Earns/PoolExplorer/styles'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { EarnPool } from 'pages/Earns/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'

const BLOCKS_PER_CYCLE = 2016
const DAY_SECONDS = 24 * 60 * 60
const WEEK_SECONDS = 7 * 24 * 60 * 60

const REWARD_WINDOW_MULTIPLIER = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
} as const

type RewardWindow = keyof typeof REWARD_WINDOW_MULTIPLIER

type Props = {
  pool: EarnPool
  showEstimate?: boolean
}

const getEffectiveRewardDays = ({
  endTime,
  now,
  rewardWindow,
  startTime,
}: {
  endTime?: number
  now: number
  rewardWindow: RewardWindow
  startTime?: number
}) => {
  const windowSeconds = REWARD_WINDOW_MULTIPLIER[rewardWindow] * DAY_SECONDS
  const windowStart = now - windowSeconds
  const effectiveStart = Math.max(startTime || windowStart, windowStart)
  const effectiveEnd = Math.min(endTime || now, now)

  return Math.max(0, effectiveEnd - effectiveStart) / DAY_SECONDS
}

const RewardTooltipContent = ({
  bonusRewards,
  egRewards,
  lmRewards,
}: {
  bonusRewards: number
  egRewards: number
  lmRewards: number
}) => {
  return (
    <Stack className="gap-0.5">
      {egRewards > 0 && (
        <p>
          {t`FairFlow EG Rewards`}: {formatDisplayNumber(egRewards, { style: 'currency', significantDigits: 4 })}
        </p>
      )}
      {lmRewards > 0 && (
        <p>
          {t`LM Rewards`}: {formatDisplayNumber(lmRewards, { style: 'currency', significantDigits: 4 })}
        </p>
      )}
      {bonusRewards > 0 && (
        <p>
          {t`Bonus Rewards`}: {formatDisplayNumber(bonusRewards, { style: 'currency', significantDigits: 4 })}
        </p>
      )}
    </Stack>
  )
}

const PoolRewardsInfo = ({ pool, showEstimate = true }: Props) => {
  const { filters } = useFilter()

  const depositAmount = 1_000
  const rewardWindow: RewardWindow = (filters.interval as RewardWindow) || '24h'
  const now = Math.floor(Date.now() / 1000)

  const egRewards = pool.egUsd || 0

  const kemRewardTokens = useMemo(() => {
    const cycleDuration = (pool.kemReward?.endTime || 0) - (pool.kemReward?.startTime || 0)
    const depositShare = pool.tvl > 0 ? depositAmount / (pool.tvl + depositAmount) : 0

    return (pool.kemReward?.rewardCfg || [])
      .map(reward => {
        const decimals = reward.tokenInfo?.decimals
        const amountPerBlock = decimals !== undefined ? getParsedRewardAmount(reward.amountReward, decimals) : 0
        const totalAmount = amountPerBlock * BLOCKS_PER_CYCLE
        const dailyTotalAmount = cycleDuration > 0 ? totalAmount * (DAY_SECONDS / cycleDuration) : 0
        const weeklyTotalAmount = cycleDuration > 0 ? totalAmount * (WEEK_SECONDS / cycleDuration) : 0

        return {
          address: reward.tokenInfo?.address || reward.tokenAddress,
          logoURI: reward.tokenInfo?.logoURL,
          symbol: reward.tokenInfo?.symbol,
          totalAmount,
          dailyTotalAmount,
          weeklyTotalAmount,
          estWeeklyAmount: weeklyTotalAmount * depositShare,
        }
      })
      .filter(token => token.totalAmount > 0)
  }, [depositAmount, pool.kemReward?.endTime, pool.kemReward?.rewardCfg, pool.kemReward?.startTime, pool.tvl])

  const kemRewardTokenPrices = useTokenPrices(
    useMemo(() => kemRewardTokens.map(token => token.address), [kemRewardTokens]),
    pool.chainId,
  )

  const lmRewardDays = getEffectiveRewardDays({
    endTime: pool.kemReward?.endTime,
    now,
    rewardWindow,
    startTime: pool.kemReward?.startTime,
  })

  const lmRewards = useMemo(() => {
    return kemRewardTokens.reduce((sum, token) => {
      const tokenPrice = kemRewardTokenPrices[token.address] || 0
      return sum + token.dailyTotalAmount * tokenPrice * lmRewardDays
    }, 0)
  }, [kemRewardTokenPrices, kemRewardTokens, lmRewardDays])

  const kemWeeklyTotalUsd = useMemo(
    () =>
      kemRewardTokens.reduce(
        (sum, token) => sum + token.weeklyTotalAmount * (kemRewardTokenPrices[token.address] || 0),
        0,
      ),
    [kemRewardTokenPrices, kemRewardTokens],
  )

  const bonusRewards = (pool.merklOpportunity?.campaigns ?? []).reduce((sum, campaign) => {
    const rewardDays = getEffectiveRewardDays({
      endTime: campaign.endTimestamp,
      now,
      rewardWindow: rewardWindow,
      startTime: campaign.startTimestamp,
    })
    return sum + campaign.dailyRewards * rewardDays
  }, 0)

  const totalRewards = egRewards + lmRewards + bonusRewards

  const merklRewardTokens = useMemo(() => {
    const breakdowns = pool.merklOpportunity?.rewardsRecord?.breakdowns || []
    return breakdowns.map(reward => ({
      ...reward.token,
      amount: getFullDisplayBalance(reward.amount, reward.token.decimals, 2),
    }))
  }, [pool.merklOpportunity?.rewardsRecord?.breakdowns])

  const merklTvl = pool.merklOpportunity?.tvl || 0
  const merklWeeklyRewards = (pool.merklOpportunity?.dailyRewards ?? 0) * 7
  const estWeeklyRewards = (depositAmount / (merklTvl + depositAmount)) * merklWeeklyRewards

  return (
    <Stack className="gap-2">
      {totalRewards > 0 ? (
        <MouseoverTooltipDesktopOnly
          text={<RewardTooltipContent egRewards={egRewards} lmRewards={lmRewards} bonusRewards={bonusRewards} />}
          width="fit-content"
          placement="left"
        >
          <span>{formatDisplayNumber(totalRewards, { style: 'currency', significantDigits: 4 })}</span>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <span>{formatDisplayNumber(totalRewards, { style: 'currency', significantDigits: 4 })}</span>
      )}

      {(merklRewardTokens.length > 0 || kemRewardTokens.length > 0) && (
        <HStack className="items-center justify-end gap-1">
          {merklRewardTokens.length > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <Stack className="gap-1">
                  {merklRewardTokens.map(token => (
                    <HStack key={`${token.chainId}-${token.address}`} className="items-center gap-1">
                      {token.icon ? <TokenLogo src={token.icon} size={16} /> : null}
                      <span>
                        {token.amount} {token.symbol}
                      </span>
                    </HStack>
                  ))}
                </Stack>
              }
              width="fit-content"
              placement="bottom"
            >
              <HStack className="flex-wrap items-center justify-end gap-1">
                {merklRewardTokens.map(token => (
                  <TokenLogo key={`${token.chainId}-${token.address}`} src={token.icon} size={16} />
                ))}
              </HStack>
            </MouseoverTooltipDesktopOnly>
          )}

          {kemRewardTokens.length > 0 && (
            <HStack className="flex-wrap items-center justify-end gap-1">
              {kemRewardTokens.map(token => (
                <MouseoverTooltipDesktopOnly
                  key={token.address}
                  text={
                    <HStack className="items-center gap-1">
                      {token.logoURI ? <TokenLogo src={token.logoURI} size={16} /> : null}
                      <span>
                        {formatDisplayNumber(token.totalAmount, { significantDigits: 6 })} {token.symbol}
                      </span>
                    </HStack>
                  }
                  width="fit-content"
                  placement="bottom"
                >
                  <TokenLogo src={token.logoURI} size={16} />
                </MouseoverTooltipDesktopOnly>
              ))}
            </HStack>
          )}

          {showEstimate && merklWeeklyRewards > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <p>
                  <span className="font-medium text-blue3">
                    {formatDisplayNumber(estWeeklyRewards, { style: 'currency', significantDigits: 4 })}/week
                  </span>{' '}
                  {`when adding $${depositAmount} liquidity (est)`}
                </p>
              }
              width="fit-content"
              placement="bottom"
            >
              <Badge className="px-1.5 py-1">
                <RewardIcon width={16} height={16} />
                <span className="whitespace-nowrap">
                  {formatDisplayNumber(merklWeeklyRewards, { style: 'currency', significantDigits: 4 })}/week
                </span>
              </Badge>
            </MouseoverTooltipDesktopOnly>
          )}

          {showEstimate && kemRewardTokens.length > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <p>
                  {kemRewardTokens.map((token, index) => (
                    <span key={token.address}>
                      {index > 0 ? ' and ' : ''}
                      <span className="font-medium text-blue3">
                        {formatDisplayNumber(token.estWeeklyAmount, { significantDigits: 6 })} {token.symbol}
                        {index === kemRewardTokens.length - 1 ? '/week' : ''}
                      </span>
                    </span>
                  ))}{' '}
                  {`when adding $${depositAmount} liquidity (est)`}
                </p>
              }
              width="fit-content"
              placement="bottom"
            >
              <Badge className="px-1.5 py-1">
                <RewardIcon width={16} height={16} />
                <span className="whitespace-nowrap">
                  {formatDisplayNumber(kemWeeklyTotalUsd, { style: 'currency', significantDigits: 4 })}/week
                </span>
              </Badge>
            </MouseoverTooltipDesktopOnly>
          )}
        </HStack>
      )}
    </Stack>
  )
}

export default PoolRewardsInfo
