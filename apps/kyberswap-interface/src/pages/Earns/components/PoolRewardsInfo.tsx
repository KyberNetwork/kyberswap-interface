import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { ReactComponent as RewardIcon } from 'assets/svg/earn/ic_bag.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { Badge } from 'pages/Earns/PoolExplorer/styles'
import { EarnPool } from 'pages/Earns/types'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  pool: EarnPool
  showEstimate?: boolean
}

const RewardTooltipContent = ({ egRewards, bonusRewards }: { egRewards: number; bonusRewards: number }) => {
  return (
    <Stack className="gap-0.5">
      {egRewards > 0 && (
        <p>
          {t`FairFlow EG Rewards`}: {formatDisplayNumber(egRewards, { style: 'currency', significantDigits: 4 })}
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
  const egRewards = pool.egUsd || 0
  const bonusRewards = pool.merklOpportunity?.dailyRewards ?? 0
  const totalRewards = egRewards + bonusRewards
  const hasRewards = totalRewards > 0

  const depositAmount = 1000
  const merklTvl = pool.merklOpportunity?.tvl || 0
  const weeklyRewards = bonusRewards * 7
  const weeklyRewardsEst = (depositAmount / (merklTvl + depositAmount)) * weeklyRewards

  const rewardTokens = useMemo(() => {
    const breakdowns = pool.merklOpportunity?.rewardsRecord?.breakdowns || []
    return breakdowns.map(reward => ({
      ...reward.token,
      amount: getFullDisplayBalance(BigNumber.from(reward.amount), reward.token.decimals, 2),
    }))
  }, [pool.merklOpportunity?.rewardsRecord?.breakdowns])

  return (
    <Stack className="gap-2">
      {hasRewards ? (
        <MouseoverTooltipDesktopOnly
          text={<RewardTooltipContent egRewards={egRewards} bonusRewards={bonusRewards} />}
          width="fit-content"
          placement="left"
        >
          <span>{formatDisplayNumber(totalRewards, { style: 'currency', significantDigits: 4 })}</span>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <span>{formatDisplayNumber(totalRewards, { style: 'currency', significantDigits: 4 })}</span>
      )}

      {rewardTokens.length > 0 && showEstimate && weeklyRewards > 0 && (
        <HStack className="items-center justify-end gap-1">
          {rewardTokens.length > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <Stack className="gap-1">
                  {rewardTokens.map(token => (
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
                {rewardTokens.map(token => (
                  <TokenLogo key={`${token.chainId}-${token.address}`} src={token.icon} size={16} />
                ))}
              </HStack>
            </MouseoverTooltipDesktopOnly>
          )}

          {showEstimate && weeklyRewards > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <p>
                  <span className="font-medium text-blue3">
                    {formatDisplayNumber(weeklyRewardsEst, { style: 'currency', significantDigits: 4 })}/week
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
                  {formatDisplayNumber(weeklyRewards, { style: 'currency', significantDigits: 4 })}/week
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
