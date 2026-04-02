import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { Text } from 'rebass'
import { useGetTokenByAddressesQuery } from 'services/ksSetting'
import { CycleConfigResponse, useCycleConfigQuery } from 'services/kyberdata'
import styled from 'styled-components'

import ProgressBar from 'components/ProgressBar'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import {
  formatAmount,
  formatDateRange,
  formatUsdValue,
  getParsedRewardAmount,
  getProgressPercent,
} from 'pages/Earns/PoolDetail/components/utils'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { type MerklOpportunity } from 'pages/Earns/types/pool'
import { type WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

const BLOCKS_PER_CYCLE = 2016

type RewardCardItemProps = {
  apr?: number
  chainIcon: string
  chainName: string
  from?: number
  icon?: string
  name: string
  to?: number
  token: {
    dailyAmount?: number
    price?: number
    symbol?: string
    totalAmount?: number
  }
}

type RewardCardData = RewardCardItemProps & {
  id: string
}

type RewardTokenMetadata = WrappedTokenInfo | NativeCurrency
type RewardTokenMap = Record<string, RewardTokenMetadata>
type BuildLmRewardCardsParams = {
  cycleConfig?: CycleConfigResponse
  lmApr: number
  poolDexIcon: string
  poolDexName: string
  rewardTokensByAddress: RewardTokenMap
}

const RewardCard = styled(Stack)`
  gap: 12px;
  min-width: 320px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonGray};
  flex: 1 1 calc(50% - 8px);
`

const ProgressLabelWrapper = styled(HStack)<{ $width: string }>`
  position: absolute;
  top: 0;
  left: 0;
  align-items: center;
  justify-content: flex-end;
  width: ${({ $width }) => $width};
  min-width: 64px;
  height: 16px;
  padding-right: 10px;
  pointer-events: none;
`

const buildLmRewardCards = ({
  cycleConfig,
  lmApr,
  poolDexIcon,
  poolDexName,
  rewardTokensByAddress,
}: BuildLmRewardCardsParams): RewardCardData[] => {
  if (!cycleConfig?.rewardCfg.length) return []

  return cycleConfig.rewardCfg.map((reward, index) => {
    const token = rewardTokensByAddress[reward.tokenAddress.toLowerCase()]
    const amountReward = getParsedRewardAmount(reward.amountReward, token?.decimals)
    const totalAmount = amountReward * BLOCKS_PER_CYCLE
    const chainInfo = NETWORKS_INFO[token?.chainId as ChainId]

    return {
      id: `lm-${reward.tokenAddress}-${index}`,
      name: poolDexName,
      icon: poolDexIcon,
      apr: lmApr / (cycleConfig.rewardCfg.length || 1),
      chainName: chainInfo?.name,
      chainIcon: chainInfo?.icon,
      from: cycleConfig.startTime,
      to: cycleConfig.endTime,
      token: {
        symbol: token?.symbol,
        totalAmount,
      },
    }
  })
}

const buildMerklRewardCards = ({ merklOpportunity }: { merklOpportunity?: MerklOpportunity }): RewardCardData[] => {
  if (!merklOpportunity?.campaigns.length) return []

  return merklOpportunity.campaigns.map(campaign => {
    const reward = merklOpportunity.rewardsRecord.breakdowns.find(item => item.campaignId === campaign.id)
    const dailyAmount = reward ? getParsedRewardAmount(reward.amount, reward.token.decimals) : 0
    const chainInfo = NETWORKS_INFO[reward?.token.chainId as ChainId]

    return {
      id: campaign.id,
      name: merklOpportunity.protocol.name,
      icon: merklOpportunity.protocol.icon,
      apr: campaign.apr,
      chainName: chainInfo?.name,
      chainIcon: chainInfo?.icon,
      from: campaign.startTimestamp,
      to: campaign.endTimestamp,
      token: {
        dailyAmount,
        price: reward?.token.price,
        symbol: reward?.token.symbol,
      },
    }
  })
}

const PoolEarningReward = () => {
  const { chainId, chainInfo, dexInfo, pool, poolAddress } = usePoolDetailContext()
  const hasLmProgram = pool?.programs?.some(program => program === 'lm') ?? false

  const { data: cycleConfig } = useCycleConfigQuery(
    { chain: chainInfo.route, poolAddress },
    { skip: !pool || !hasLmProgram || !chainInfo.route },
  )

  const rewardTokenAddresses = useMemo(
    () => [...new Set(cycleConfig?.rewardCfg.map(item => item.tokenAddress.toLowerCase()) ?? [])],
    [cycleConfig],
  )

  const { data: rewardTokens } = useGetTokenByAddressesQuery(
    { addresses: rewardTokenAddresses, chainId: chainId as ChainId },
    { skip: !rewardTokenAddresses.length },
  )

  const rewardTokensByAddress = useMemo(
    () =>
      (rewardTokens ?? []).reduce<RewardTokenMap>((acc, token) => {
        const address = token?.wrapped?.address?.toLowerCase() || ''
        if (!address) return acc

        acc[address] = token
        return acc
      }, {}),
    [rewardTokens],
  )

  const rewardCards = useMemo(() => {
    const lmRewardCards = buildLmRewardCards({
      cycleConfig,
      lmApr: pool?.poolStats?.kemLMApr ?? 0,
      poolDexIcon: dexInfo.logo,
      poolDexName: dexInfo.name,
      rewardTokensByAddress,
    })
    const merklRewardCards = buildMerklRewardCards({
      merklOpportunity: pool?.merklOpportunity,
    })

    return [...lmRewardCards, ...merklRewardCards]
  }, [
    cycleConfig,
    dexInfo.logo,
    dexInfo.name,
    pool?.merklOpportunity,
    pool?.poolStats?.kemLMApr,
    rewardTokensByAddress,
  ])

  if (!rewardCards.length) return null

  return (
    <HStack align="stretch" gap={16} wrap="wrap">
      {rewardCards.map(card => (
        <RewardCardItem key={card.id} {...card} />
      ))}
    </HStack>
  )
}

const RewardCardItem = ({ chainIcon, chainName, from, icon, name, to, token }: RewardCardItemProps) => {
  const theme = useTheme()
  const progressPercent = getProgressPercent(from, to)
  const distributedAmount = token.totalAmount ? (token.totalAmount * progressPercent) / 100 : 0

  return (
    <RewardCard>
      <HStack align="center" gap={8} wrap="wrap">
        <HStack align="flex-end" flex="0 0 auto">
          <TokenLogo size={24} src={icon} />
          <TokenLogo size={16} src={chainIcon} translateLeft translateTop />
        </HStack>

        <Text color={theme.text} fontSize={20} fontWeight={500}>
          {name}
        </Text>
      </HStack>

      {token.dailyAmount !== undefined ? (
        <HStack align="baseline" gap={4} wrap="wrap">
          <Text color={theme.subText} fontSize={14}>
            Daily Rewards:
          </Text>
          <Text color={theme.text} fontWeight={500}>
            {formatAmount(token.dailyAmount)} {token.symbol}
          </Text>
          {token.price !== undefined ? (
            <Text color={theme.subText} fontSize={14} fontWeight={500}>
              ~{formatUsdValue(token.dailyAmount * token.price)}
            </Text>
          ) : null}
        </HStack>
      ) : (
        <HStack align="baseline" gap={4} wrap="wrap">
          <Text color={theme.text} fontWeight={500}>
            {formatAmount(distributedAmount)} {token.symbol}
          </Text>
          <Text color={theme.subText} fontSize={14} fontWeight={500}>
            / {formatAmount(token.totalAmount)} {token.symbol}
          </Text>
        </HStack>
      )}

      <Stack position="relative">
        <ProgressBar
          backgroundColor={rgba(theme.white, 0.08)}
          color="#05966B"
          height="16px"
          percent={progressPercent}
          width="100%"
        />
        <ProgressLabelWrapper $width={`${Math.max(progressPercent, 12)}%`}>
          <Text color={theme.white} fontSize={12} fontWeight={600}>
            {Math.round(progressPercent)}%
          </Text>
        </ProgressLabelWrapper>
      </Stack>

      <Stack gap={12}>
        <HStack align="center" justify="space-between" wrap="wrap">
          <Text color={theme.subText} fontSize={14}>
            Date
          </Text>
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {formatDateRange(from, to)}
          </Text>
        </HStack>

        <HStack align="center" justify="space-between" wrap="wrap">
          <Text color={theme.subText} fontSize={14}>
            Reward Chain
          </Text>
          <HStack align="center" gap={4}>
            <TokenLogo size={18} src={chainIcon} />
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {chainName}
            </Text>
          </HStack>
        </HStack>
      </Stack>
    </RewardCard>
  )
}

export default PoolEarningReward
