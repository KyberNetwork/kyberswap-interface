import { formatAprNumber } from '@kyber/utils'
import { toRawString } from '@kyber/utils/number'
import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useGetTokenByAddressesQuery } from 'services/ksSetting'
import { CycleConfigResponse, useCycleConfigQuery } from 'services/kyberdata'

import ProgressBar from 'components/ProgressBar'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { type NetworkInfo } from 'constants/networks/type'
import useTheme from 'hooks/useTheme'
import { type Pool } from 'pages/Earns/PoolDetail/types'
import { type MerklOpportunity } from 'pages/Earns/types/pool'
import { type WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type RewardProgram = {
  color: string
  key: 'bonus' | 'eg' | 'lm'
  label: string
  value: number
}

type RewardCard = {
  amountLine: string
  badge?: string
  dateLine?: string
  iconSrc?: string
  id: string
  progressPercent: number
  secondaryLine?: string
  strategy?: string
  title: string
}

type RewardTokenMetadata = WrappedTokenInfo | NativeCurrency
type RewardTokenMap = Record<string, RewardTokenMetadata>
type GroupedMerklReward = { amount: number; iconSrc?: string; symbol: string; value: number }

type AprSummary = {
  feeShare: number
  lmApr: number
  rewardPrograms: RewardProgram[]
  rewardShare: number
  totalApr: number
}

type PoolEarningsInsightsProps = {
  chainId: number
  chainInfo: NetworkInfo
  pool: Pool
  poolAddress: string
}

const BLOCKS_PER_CYCLE = 2016

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const formatAprValue = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

const formatProgramAmount = (value?: number) =>
  value || value === 0 ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'

const formatDateRange = (startTime?: number, endTime?: number) => {
  if (!startTime || !endTime) return '--'

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return `${formatter.format(new Date(startTime * 1000))} -> ${formatter.format(new Date(endTime * 1000))}`
}

const formatCampaignCount = (count: number) => `${count} live campaign${count > 1 ? 's' : ''}`

const getProgressPercent = (startTime?: number, endTime?: number) => {
  if (!startTime || !endTime || endTime <= startTime) return 0

  const now = Math.floor(Date.now() / 1000)
  return clamp(((now - startTime) / (endTime - startTime)) * 100, 0, 100)
}

const getTokenAddress = (token?: RewardTokenMetadata) => token?.wrapped?.address?.toLowerCase() || ''
const getTokenLogo = (token?: RewardTokenMetadata) => (token && 'logoURI' in token ? token.logoURI : undefined)

const getTokenAmountFromRaw = (value: string | number, decimals: number) => {
  try {
    return Number(toRawString(BigInt(value.toString()), decimals))
  } catch {
    return Number(value) || 0
  }
}

const getAprSummary = (pool: Pool): AprSummary => {
  const feeApr = pool.lpApr ?? 0
  const egApr = pool.kemEGApr ?? 0
  const lmApr = pool.kemLMApr ?? 0
  const bonusApr = pool.bonusApr ?? pool.merklOpportunity?.apr ?? 0
  const totalApr = pool.allApr ?? feeApr + egApr + lmApr + bonusApr
  const rewardApr = egApr + lmApr + bonusApr
  const rewardPrograms: RewardProgram[] = []

  if (lmApr > 0) {
    rewardPrograms.push({ color: '#42B8AE', key: 'lm', label: 'LM Rewards', value: lmApr })
  }

  if (egApr > 0) {
    rewardPrograms.push({ color: '#DFD56A', key: 'eg', label: 'EG Sharing', value: egApr })
  }

  if (bonusApr > 0) {
    rewardPrograms.push({
      color: '#9B7AE4',
      key: 'bonus',
      label: pool.merklOpportunity?.protocol.name || 'Bonus Rewards',
      value: bonusApr,
    })
  }

  return {
    feeShare: totalApr > 0 ? (feeApr / totalApr) * 100 : 0,
    lmApr,
    rewardPrograms,
    rewardShare: totalApr > 0 ? (rewardApr / totalApr) * 100 : 0,
    totalApr,
  }
}

const getRewardTokenAddresses = (cycleConfig?: CycleConfigResponse, merklOpportunity?: MerklOpportunity) => {
  const cycleAddresses = cycleConfig?.rewardCfg.map(item => item.tokenAddress.toLowerCase()) ?? []
  const merklAddresses = merklOpportunity?.rewardsRecord.breakdowns.map(item => item.token.address.toLowerCase()) ?? []

  return [...new Set([...cycleAddresses, ...merklAddresses])]
}

const buildRewardTokenMap = (tokens?: RewardTokenMetadata[]) =>
  (tokens ?? []).reduce<RewardTokenMap>((acc, token) => {
    const address = getTokenAddress(token)
    if (!address) return acc

    acc[address] = token
    return acc
  }, {})

const buildLmRewardCards = (
  cycleConfig: CycleConfigResponse | undefined,
  rewardTokensByAddress: RewardTokenMap,
  lmApr: number,
): RewardCard[] => {
  if (!cycleConfig?.rewardCfg.length) return []

  const progressPercent = getProgressPercent(cycleConfig.startTime, cycleConfig.endTime)
  const rewardCount = cycleConfig.rewardCfg.length
  const badge = lmApr > 0 ? `${formatAprNumber(lmApr / rewardCount)}%` : undefined

  return cycleConfig.rewardCfg.map((reward, index) => {
    const token = rewardTokensByAddress[reward.tokenAddress.toLowerCase()]
    const symbol = token?.symbol || ''
    const totalReward = getTokenAmountFromRaw(reward.amountReward, token?.decimals ?? 18) * BLOCKS_PER_CYCLE
    const distributedReward = totalReward * (progressPercent / 100)

    return {
      amountLine: `${formatProgramAmount(distributedReward)} ${symbol} / ${formatProgramAmount(
        totalReward,
      )} ${symbol}`.trim(),
      badge,
      dateLine: formatDateRange(cycleConfig.startTime, cycleConfig.endTime),
      iconSrc: getTokenLogo(token),
      id: `lm-${reward.tokenAddress}-${index}`,
      progressPercent,
      secondaryLine: rewardCount > 1 ? `Reward token ${index + 1} of ${rewardCount}` : undefined,
      strategy: '7D cycle',
      title: symbol ? `LM Rewards • ${symbol}` : 'LM Rewards',
    }
  })
}

const buildBonusRewardCard = (
  merklOpportunity: MerklOpportunity | undefined,
  rewardTokensByAddress: RewardTokenMap,
  bonusApr?: number,
): RewardCard | null => {
  if (!merklOpportunity) return null

  const groupedRewards = merklOpportunity.rewardsRecord.breakdowns.reduce<Record<string, GroupedMerklReward>>(
    (acc, item) => {
      const address = item.token.address.toLowerCase()
      const token = rewardTokensByAddress[address]
      const symbol = token?.symbol || item.token.displaySymbol || item.token.symbol

      if (!acc[address]) {
        acc[address] = {
          amount: 0,
          iconSrc: getTokenLogo(token),
          symbol,
          value: 0,
        }
      }

      acc[address].amount += Number(item.amount) || 0
      acc[address].value += item.value || 0
      return acc
    },
    {},
  )

  const topReward = Object.values(groupedRewards).sort((a, b) => b.value - a.value)[0]
  const campaignStart = merklOpportunity.campaigns.reduce<number | undefined>(
    (min, campaign) => (min === undefined ? campaign.startTimestamp : Math.min(min, campaign.startTimestamp)),
    undefined,
  )
  const campaignEnd = merklOpportunity.campaigns.reduce<number | undefined>(
    (max, campaign) => (max === undefined ? campaign.endTimestamp : Math.max(max, campaign.endTimestamp)),
    undefined,
  )
  const campaignCountLabel = formatCampaignCount(merklOpportunity.liveCampaigns)

  return {
    amountLine: topReward
      ? `${formatProgramAmount(topReward.amount)} ${topReward.symbol}`
      : formatDisplayNumber(merklOpportunity.dailyRewards, { significantDigits: 6, style: 'currency' }),
    badge: bonusApr && bonusApr > 0 ? `${formatAprNumber(bonusApr)}%` : undefined,
    dateLine: formatDateRange(campaignStart, campaignEnd),
    iconSrc: topReward?.iconSrc,
    id: 'bonus-program',
    progressPercent: getProgressPercent(campaignStart, campaignEnd),
    secondaryLine: topReward?.value
      ? `~ ${formatDisplayNumber(topReward.value, { significantDigits: 6, style: 'currency' })}`
      : campaignCountLabel,
    strategy: campaignCountLabel,
    title: merklOpportunity.protocol.name || 'Bonus Rewards',
  }
}

const PoolEarningsInsights = ({ chainId, chainInfo, pool, poolAddress }: PoolEarningsInsightsProps) => {
  const theme = useTheme()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const isLmPool = pool.programs?.some(program => program === 'lm') ?? false

  const { data: cycleConfig } = useCycleConfigQuery(
    {
      chain: chainInfo.route,
      poolAddress,
    },
    { skip: !isLmPool || !chainInfo.route },
  )

  const rewardTokenAddresses = useMemo(
    () => getRewardTokenAddresses(cycleConfig, pool.merklOpportunity),
    [cycleConfig, pool.merklOpportunity],
  )

  const { data: rewardTokens } = useGetTokenByAddressesQuery(
    {
      addresses: rewardTokenAddresses,
      chainId: chainId as ChainId,
    },
    { skip: !rewardTokenAddresses.length },
  )

  const rewardTokensByAddress = useMemo(() => buildRewardTokenMap(rewardTokens), [rewardTokens])

  const aprSummary = useMemo(() => getAprSummary(pool), [pool])

  const rewardCards = useMemo(() => {
    const cards = buildLmRewardCards(cycleConfig, rewardTokensByAddress, aprSummary.lmApr)
    const bonusCard = buildBonusRewardCard(
      pool.merklOpportunity,
      rewardTokensByAddress,
      aprSummary.rewardPrograms.find(item => item.key === 'bonus')?.value,
    )

    return bonusCard ? [...cards, bonusCard] : cards
  }, [aprSummary.lmApr, aprSummary.rewardPrograms, cycleConfig, pool.merklOpportunity, rewardTokensByAddress])

  const showInsights = Boolean(aprSummary.totalApr) || aprSummary.rewardPrograms.length > 0 || rewardCards.length > 0

  if (!showInsights) return null

  return (
    <Stack
      gap={16}
      pt={8}
      sx={{
        borderTop: `1px solid ${rgba(theme.subText, 0.12)}`,
      }}
    >
      <Text
        color={theme.subText}
        fontSize={14}
        sx={{
          alignSelf: 'flex-start',
          background: theme.tableHeader,
          borderRadius: '12px',
          px: '14px',
          py: '10px',
        }}
      >
        Lifetime
      </Text>

      <HStack align="stretch" gap={16} wrap="wrap">
        <Stack flex="0 0 auto" gap={10} minWidth={upToSmall ? '100%' : '220px'}>
          <Text color={theme.text} fontSize={16} fontWeight={500}>
            APR
          </Text>

          <Text
            color={theme.primary}
            fontSize={upToSmall ? 24 : 28}
            fontWeight={500}
            sx={{
              alignSelf: 'flex-start',
              background: rgba(theme.primary, 0.16),
              borderRadius: '16px',
              lineHeight: 1,
              px: '18px',
              py: '14px',
            }}
          >
            {formatAprValue(aprSummary.totalApr)}
          </Text>
        </Stack>

        <Stack
          sx={{
            alignSelf: 'stretch',
            background: rgba(theme.subText, 0.12),
            height: upToSmall ? '1px' : 'auto',
            minHeight: upToSmall ? '1px' : 'unset',
            width: upToSmall ? '100%' : '1px',
          }}
        />

        <Stack flex="1 1 320px" gap={12}>
          <HStack gap={16} wrap="wrap">
            <HStack align="baseline" gap={8} wrap="wrap">
              <Text color={theme.subText} fontSize={14}>
                Fee
              </Text>
              <Text color={theme.text} fontSize={upToSmall ? 24 : 28} fontWeight={500}>
                {formatAprValue(aprSummary.feeShare)}
              </Text>
            </HStack>

            <HStack align="baseline" gap={8} wrap="wrap">
              <Text color={theme.subText} fontSize={14}>
                Rewards
              </Text>
              <Text color={theme.text} fontSize={upToSmall ? 24 : 28} fontWeight={500}>
                {formatAprValue(aprSummary.rewardShare)}
              </Text>
            </HStack>
          </HStack>

          {aprSummary.rewardPrograms.length ? (
            <HStack gap={10} wrap="wrap">
              {aprSummary.rewardPrograms.map(item => (
                <HStack
                  align="center"
                  gap={8}
                  key={item.key}
                  sx={{
                    background: theme.tableHeader,
                    borderRadius: '999px',
                    px: '12px',
                    py: '8px',
                  }}
                >
                  <Stack
                    sx={{
                      background: item.color,
                      borderRadius: '999px',
                      flexShrink: 0,
                      height: 12,
                      width: 12,
                    }}
                  />
                  <Text color={theme.subText} fontSize={14}>
                    {item.label}
                  </Text>
                  <Text color={theme.text} fontSize={14} fontWeight={500}>
                    {formatAprValue(item.value)}
                  </Text>
                </HStack>
              ))}
            </HStack>
          ) : null}
        </Stack>
      </HStack>

      {rewardCards.length ? (
        <HStack align="stretch" gap={16} wrap="wrap">
          {rewardCards.map(card => (
            <Stack
              gap={14}
              key={card.id}
              px="20px"
              py="18px"
              sx={{
                background: theme.tableHeader,
                border: `1px solid ${rgba(theme.white, 0.04)}`,
                borderRadius: '20px',
                flex: upToSmall ? '1 1 100%' : '1 1 calc(50% - 8px)',
                minWidth: upToSmall ? '100%' : '320px',
              }}
            >
              <HStack align="center" gap={12} justify="space-between" wrap="wrap">
                <HStack align="center" gap={12} wrap="wrap">
                  {card.iconSrc ? (
                    <TokenLogo size={32} src={card.iconSrc} />
                  ) : (
                    <Stack
                      align="center"
                      justify="center"
                      sx={{
                        background: rgba(theme.primary, 0.16),
                        borderRadius: '999px',
                        height: 32,
                        width: 32,
                      }}
                    >
                      <Text color={theme.primary} fontSize={16} fontWeight={500}>
                        {card.title.charAt(0)}
                      </Text>
                    </Stack>
                  )}

                  <Stack gap={4}>
                    <Text color={theme.text} fontSize={18} fontWeight={500}>
                      {card.title}
                    </Text>
                    {card.secondaryLine ? (
                      <Text color={theme.subText} fontSize={13}>
                        {card.secondaryLine}
                      </Text>
                    ) : null}
                  </Stack>
                </HStack>

                {card.badge ? (
                  <Text color={theme.text} fontSize={16} fontWeight={500}>
                    {card.badge}
                  </Text>
                ) : null}
              </HStack>

              <Text color={theme.text} fontSize={16} fontWeight={500}>
                {card.amountLine}
              </Text>

              <Stack gap={6}>
                <ProgressBar
                  backgroundColor={rgba(theme.white, 0.08)}
                  color={theme.primary}
                  height="10px"
                  percent={card.progressPercent}
                  width="100%"
                />
                <Text alignSelf="flex-end" color={theme.text} fontSize={12} fontWeight={500}>
                  {Math.round(card.progressPercent)}%
                </Text>
              </Stack>

              <Stack gap={10}>
                <HStack align="center" justify="space-between" wrap="wrap">
                  <Text color={theme.subText} fontSize={14}>
                    Date
                  </Text>
                  <Text color={theme.text} fontSize={14} fontWeight={500}>
                    {card.dateLine || '--'}
                  </Text>
                </HStack>

                <HStack align="center" justify="space-between" wrap="wrap">
                  <Text color={theme.subText} fontSize={14}>
                    Reward Chain
                  </Text>
                  <HStack align="center" gap={8}>
                    <TokenLogo size={18} src={chainInfo.icon} />
                    <Text color={theme.text} fontSize={14} fontWeight={500}>
                      {chainInfo.name}
                    </Text>
                  </HStack>
                </HStack>

                {card.strategy ? (
                  <HStack align="center" justify="space-between" wrap="wrap">
                    <Text color={theme.subText} fontSize={14}>
                      Distribution
                    </Text>
                    <Text color={theme.text} fontSize={14} fontWeight={500}>
                      {card.strategy}
                    </Text>
                  </HStack>
                ) : null}
              </Stack>
            </Stack>
          ))}
        </HStack>
      ) : null}
    </Stack>
  )
}

export default PoolEarningsInsights
