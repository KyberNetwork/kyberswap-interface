import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'

import { ReactComponent as RewardIcon } from 'assets/svg/earn/ic_bag.svg'
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

const MerklRewardsRecord = ({ pool, showEstimate = true }: Props) => {
  const theme = useTheme()

  const rewardTokens = useMemo(() => {
    const breakdowns = pool.merklOpportunity?.rewardsRecord?.breakdowns || []
    return breakdowns.map(reward => {
      return {
        ...reward.token,
        amount: getFullDisplayBalance(BigNumber.from(reward.amount), reward.token.decimals, 2),
      }
    })
  }, [pool])

  const depositAmount = 1000
  const merklTvl = pool.merklOpportunity?.tvl || 0
  const weeklyRewards = (pool.merklOpportunity?.dailyRewards || 0) * 7
  const weeklyRewardsEst = (depositAmount / (merklTvl + depositAmount)) * weeklyRewards

  if (!pool.merklOpportunity) return null

  return (
    <Flex alignItems="center" sx={{ gap: 1, justifyContent: 'flex-end' }}>
      {rewardTokens.length > 0 && (
        <MouseoverTooltipDesktopOnly
          text={
            <Flex flexDirection="column" sx={{ gap: 1 }}>
              {rewardTokens.map(token => (
                <Flex alignItems="center" sx={{ gap: 1 }} key={`${token.chainId}-${token.address}`}>
                  {token.icon ? <TokenLogo src={token.icon} size={16} /> : null}
                  <Text>
                    {token.amount} {token.symbol}
                  </Text>
                </Flex>
              ))}
            </Flex>
          }
          width="fit-content"
          placement="bottom"
        >
          <Flex alignItems="center" sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {rewardTokens.map(token => (
              <TokenLogo key={`${token.chainId}-${token.address}`} src={token.icon} size={16} />
            ))}
          </Flex>
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
    </Flex>
  )
}

export default MerklRewardsRecord
