import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetTokenByAddressesQuery } from 'services/ksSetting'
import { CycleConfigResponse, useCycleConfigQuery } from 'services/kyberdata'

import ProgressBar from 'components/ProgressBar'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
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

type RewardCardTokenInfo = {
  dailyAmount?: number
  price?: number
  symbol?: string
  totalAmount?: number
}

type RewardCardItemProps = {
  chainIcon: string
  chainName: string
  from?: number
  icon?: string
  name: string
  to?: number
  tokens: RewardCardTokenInfo[]
}

type RewardCardData = RewardCardItemProps & {
  id: string
}

type RewardTokenMetadata = WrappedTokenInfo | NativeCurrency
type RewardTokenMap = Record<string, RewardTokenMetadata>
type BuildLmRewardCardsParams = {
  cycleConfig?: CycleConfigResponse
  poolDexIcon: string
  poolDexName: string
  rewardTokensByAddress: RewardTokenMap
}

const buildLmRewardCards = ({
  cycleConfig,
  poolDexIcon,
  poolDexName,
  rewardTokensByAddress,
}: BuildLmRewardCardsParams): RewardCardData[] => {
  if (!cycleConfig?.rewardCfg.length) return []

  // A FairFlow LM cycle shares one distribution window across all its reward tokens, so group every
  // reward token of the same reward chain into a single card with one row per token.
  const cardsByChain = new Map<string, RewardCardData>()

  cycleConfig.rewardCfg.forEach(reward => {
    const token = rewardTokensByAddress[reward.tokenAddress.toLowerCase()]
    const amountReward = getParsedRewardAmount(reward.amountReward, token?.decimals)
    const totalAmount = amountReward * BLOCKS_PER_CYCLE
    const chainId = token?.chainId as ChainId
    const chainInfo = NETWORKS_INFO[chainId]
    const tokenInfo: RewardCardTokenInfo = { symbol: token?.symbol, totalAmount }

    const chainKey = String(chainId ?? 'unknown')
    const existing = cardsByChain.get(chainKey)
    if (existing) {
      existing.tokens.push(tokenInfo)
      return
    }

    cardsByChain.set(chainKey, {
      id: `lm-${chainKey}`,
      name: poolDexName,
      icon: poolDexIcon,
      chainName: chainInfo?.name,
      chainIcon: chainInfo?.icon,
      from: cycleConfig.startTime,
      to: cycleConfig.endTime,
      tokens: [tokenInfo],
    })
  })

  return Array.from(cardsByChain.values())
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
      chainName: chainInfo?.name,
      chainIcon: chainInfo?.icon,
      from: campaign.startTimestamp,
      to: campaign.endTimestamp,
      tokens: [
        {
          dailyAmount,
          price: reward?.token.price,
          symbol: reward?.token.symbol,
        },
      ],
    }
  })
}

const PoolEarningReward = () => {
  const { chainId, chainInfo, dexInfo, pool, poolAddress } = usePoolDetailContext()
  const hasLmProgram = pool?.programs?.some(program => program === 'lm') ?? false
  const kyberDataChain = chainInfo.ksSettingRoute || chainInfo.route

  const { data: cycleConfig } = useCycleConfigQuery(
    { chain: kyberDataChain, poolAddress },
    { skip: !pool || !hasLmProgram || !kyberDataChain },
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
      poolDexIcon: dexInfo.logo,
      poolDexName: dexInfo.name,
      rewardTokensByAddress,
    })
    const merklRewardCards = buildMerklRewardCards({
      merklOpportunity: pool?.merklOpportunity,
    })

    return [...lmRewardCards, ...merklRewardCards]
  }, [cycleConfig, dexInfo.logo, dexInfo.name, pool?.merklOpportunity, rewardTokensByAddress])

  if (!rewardCards.length) return null

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      {rewardCards.map(card => (
        <RewardCardItem key={card.id} {...card} />
      ))}
    </div>
  )
}

const RewardCardItem = ({ chainIcon, chainName, from, icon, name, to, tokens }: RewardCardItemProps) => {
  const progressPercent = getProgressPercent(from, to)

  return (
    <div className="flex min-w-[320px] flex-1 basis-[calc(50%-8px)] flex-col gap-3 rounded-xl bg-buttonGray p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex shrink-0 items-end">
          <TokenLogo size={24} src={icon} />
          <TokenLogo size={16} src={chainIcon} translateLeft translateTop />
        </div>

        <span className="text-xl font-medium text-text">{name}</span>
      </div>

      <div className="flex flex-col gap-1">
        {tokens.map((token, index) =>
          token.dailyAmount !== undefined ? (
            <div className="flex flex-wrap items-baseline gap-1" key={`${token.symbol}-${index}`}>
              <span className="text-sm text-subText">Daily Rewards:</span>
              <span className="font-medium text-text">
                {formatAmount(token.dailyAmount)} {token.symbol}
              </span>
              {token.price !== undefined ? (
                <span className="text-sm font-medium text-subText">
                  ~{formatUsdValue(token.dailyAmount * token.price)}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-1" key={`${token.symbol}-${index}`}>
              <span className="font-medium text-text">
                {formatAmount(token.totalAmount ? (token.totalAmount * progressPercent) / 100 : 0)} {token.symbol}
              </span>
              <span className="text-sm font-medium text-subText">
                / {formatAmount(token.totalAmount)} {token.symbol}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="relative flex flex-col">
        <ProgressBar backgroundColor="#ffffff14" color="#05966B" height="16px" percent={progressPercent} width="100%" />
        <div
          className="pointer-events-none absolute left-0 top-0 flex h-4 min-w-[64px] items-center justify-end pr-2.5"
          style={{ width: `${Math.max(progressPercent, 12)}%` }}
        >
          <span className="text-xs font-semibold text-white">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between">
          <span className="text-sm text-subText">Date</span>
          <span className="text-sm font-medium text-text">{formatDateRange(from, to)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between">
          <span className="text-sm text-subText">Reward Chain</span>
          <div className="flex items-center gap-1">
            <TokenLogo size={18} src={chainIcon} />
            <span className="text-sm font-medium text-text">{chainName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoolEarningReward
