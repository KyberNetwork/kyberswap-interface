import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Text } from 'rebass'

import { ReactComponent as RewardIcon } from 'assets/svg/earn/ic_bag.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
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
    <Stack gap={2}>
      {egRewards > 0 && (
        <Text>
          {t`FairFlow EG Rewards`}: {formatDisplayNumber(egRewards, { style: 'currency', significantDigits: 4 })}
        </Text>
      )}
      {bonusRewards > 0 && (
        <Text>
          {t`Bonus Rewards`}: {formatDisplayNumber(bonusRewards, { style: 'currency', significantDigits: 4 })}
        </Text>
      )}
    </Stack>
  )
}

const PoolRewardsInfo = ({ pool, showEstimate = true }: Props) => {
  const theme = useTheme()

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
    <Stack gap={8}>
      {hasRewards ? (
        <MouseoverTooltipDesktopOnly
          text={<RewardTooltipContent egRewards={egRewards} bonusRewards={bonusRewards} />}
          width="fit-content"
          placement="left"
        >
          <Text>{formatDisplayNumber(totalRewards, { style: 'currency', significantDigits: 4 })}</Text>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <Text>{formatDisplayNumber(totalRewards, { style: 'currency', significantDigits: 4 })}</Text>
      )}

      {rewardTokens.length > 0 && showEstimate && weeklyRewards > 0 && (
        <HStack align="center" gap={4} justify="flex-end">
          {rewardTokens.length > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <Stack gap={4}>
                  {rewardTokens.map(token => (
                    <HStack align="center" gap={4} key={`${token.chainId}-${token.address}`}>
                      {token.icon ? <TokenLogo src={token.icon} size={16} /> : null}
                      <Text>
                        {token.amount} {token.symbol}
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              }
              width="fit-content"
              placement="bottom"
            >
              <HStack align="center" gap={4} wrap="wrap" justify="flex-end">
                {rewardTokens.map(token => (
                  <TokenLogo key={`${token.chainId}-${token.address}`} src={token.icon} size={16} />
                ))}
              </HStack>
            </MouseoverTooltipDesktopOnly>
          )}

          {showEstimate && weeklyRewards > 0 && (
            <MouseoverTooltipDesktopOnly
              text={
                <Text>
                  <Text as="span" color={theme.blue3} fontWeight={500}>
                    {formatDisplayNumber(weeklyRewardsEst, { style: 'currency', significantDigits: 4 })}/week
                  </Text>{' '}
                  {`when adding $${depositAmount} liquidity (est)`}
                </Text>
              }
              width="fit-content"
              placement="bottom"
            >
              <Badge style={{ padding: '4px 6px' }}>
                <RewardIcon width={16} height={16} />
                <Text sx={{ whiteSpace: 'nowrap' }}>
                  {formatDisplayNumber(weeklyRewards, { style: 'currency', significantDigits: 4 })}/week
                </Text>
              </Badge>
            </MouseoverTooltipDesktopOnly>
          )}
        </HStack>
      )}
    </Stack>
  )
}

export default PoolRewardsInfo
