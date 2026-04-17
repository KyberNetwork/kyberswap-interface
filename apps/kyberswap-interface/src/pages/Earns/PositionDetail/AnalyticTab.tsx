import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import { PositionHistory, usePositionHistoryQuery } from 'services/zapEarn'

import CopyHelper from 'components/Copy'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import { HistoryCard, HistorySectionHeader } from 'pages/Earns/PositionDetail/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import { PositionHistoryType } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const formatDateTime = (number: number) => (number < 10 ? `0${number}` : number)

const getActionLabel = (type: string): string => {
  switch (type) {
    case PositionHistoryType.DEPOSIT:
      return t`Added Liquidity`
    case PositionHistoryType.WITHDRAW:
      return t`Removed Liquidity`
    case PositionHistoryType.COLLECT_FEE:
      return t`Collected Fees`
    default:
      return type
  }
}

const getActionTotalValue = (entry: PositionHistory): number => {
  return (entry.transactions || []).reduce((sum, tx) => sum + (tx.tokenWithValue?.value || 0), 0)
}

const getActionTokensSummary = (entry: PositionHistory): Array<{ symbol: string; amount: number; logo: string }> => {
  return (entry.transactions || [])
    .filter(tx => tx.tokenWithValue && Number(tx.tokenWithValue.balance) > 0)
    .map(tx => {
      const { token, balance } = tx.tokenWithValue
      const amount = Number(balance) / Math.pow(10, token.decimals)
      return { symbol: token.symbol, amount, logo: token.logo }
    })
}

const shortenTxHash = (hash: string) => (hash ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}` : '')

const AnalyticTab = () => {
  const { position, initialLoading } = usePositionDetailContext()
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const { rewardInfo } = useKemRewards({})
  const { rewardsByPosition } = useMerklRewards({ positions: position ? [position] : undefined })

  const rewardInfoThisPosition = rewardInfo?.nfts.find(item => item.nftId === position?.tokenId.toString())
  const merklRewards = position ? rewardsByPosition[position.positionId]?.rewards || [] : []

  const { data: historyData, isLoading: isHistoryLoading } = usePositionHistoryQuery(
    {
      chainId: position?.chain.id || 0,
      tokenAddress: position?.tokenAddress || position?.positionId || '',
      tokenId: position?.tokenId || '',
      userAddress: account,
    },
    { skip: !position },
  )

  const loading = initialLoading || isHistoryLoading

  // Chronological order (oldest first)
  const chronologicalHistory = useMemo(() => (historyData ? [...historyData].reverse() : []), [historyData])

  // First DEPOSIT = liquidity source (position creation)
  const liquiditySourceEntry = useMemo(
    () => chronologicalHistory.find(item => item.type === PositionHistoryType.DEPOSIT),
    [chronologicalHistory],
  )

  // Past actions = all entries
  const pastActions = chronologicalHistory

  const createdTime = useMemo(() => {
    if (!position?.createdTime) return '--'
    const data = new Date(position.createdTime)
    const hours = formatDateTime(data.getHours())
    const minutes = formatDateTime(data.getMinutes())
    const seconds = formatDateTime(data.getSeconds())
    const day = data.getDate()
    const month = data.toLocaleString('en-US', { month: 'short' })
    const year = data.getFullYear()
    return `${hours}:${minutes}:${seconds} ${month} ${day}, ${year}`
  }, [position?.createdTime])

  const totalFeeEarned = position?.earning.earned || 0
  const totalRewardsEarned =
    (rewardInfoThisPosition?.totalUsdValue || 0) +
    (position ? rewardsByPosition[position.positionId]?.totalUsdValue || 0 : 0)
  const totalEarned = totalFeeEarned + totalRewardsEarned

  const explorerUrl = position?.chain.id ? NETWORKS_INFO[position.chain.id as ChainId]?.etherscanUrl : ''

  return (
    <Flex flexDirection="column" sx={{ gap: '32px' }}>
      {/* Earn History Section */}
      <Flex flexDirection="column" sx={{ gap: '12px' }}>
        <HistorySectionHeader>
          <Text fontSize={16} fontWeight={500} color={theme.text}>
            {t`Earn History`}
          </Text>
        </HistorySectionHeader>

        {/* Total Earned */}
        <Flex alignItems="flex-start" justifyContent="space-between">
          <Text fontSize={14} color={theme.subText}>
            {t`Total Earned`}
          </Text>
          {loading ? (
            <PositionSkeleton width={80} height={20} />
          ) : (
            <Text fontSize={14} color={theme.text} textAlign="right">
              {formatDisplayNumber(totalEarned, { style: 'currency', significantDigits: 4 })}
            </Text>
          )}
        </Flex>

        {/* Fees Earned + Rewards Earned side by side */}
        <Flex sx={{ gap: '12px' }} flexWrap="wrap">
          {/* Fees Earned Card */}
          <HistoryCard>
            <Flex alignItems="center" justifyContent="space-between">
              <Text fontSize={14} color={theme.subText}>
                {t`Fees Earned`}
              </Text>
              {loading ? (
                <PositionSkeleton width={60} height={20} />
              ) : (
                <Text fontSize={14} color={theme.text}>
                  {formatDisplayNumber(totalFeeEarned, { style: 'currency', significantDigits: 4 })}
                </Text>
              )}
            </Flex>
            {loading ? (
              <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
                <PositionSkeleton width={100} height={16} />
                <PositionSkeleton width={100} height={16} />
              </Flex>
            ) : position ? (
              <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
                <Flex alignItems="center" sx={{ gap: '4px' }}>
                  <TokenLogo src={position.token0.logo} size={16} />
                  <Text fontSize={14} color={theme.text}>
                    {formatDisplayNumber(position.token0.unclaimedAmount || 0, { significantDigits: 4 })}{' '}
                    {position.token0.symbol}
                  </Text>
                </Flex>
                <Flex alignItems="center" sx={{ gap: '4px' }}>
                  <TokenLogo src={position.token1.logo} size={16} />
                  <Text fontSize={14} color={theme.text}>
                    {formatDisplayNumber(position.token1.unclaimedAmount || 0, { significantDigits: 4 })}{' '}
                    {position.token1.symbol}
                  </Text>
                </Flex>
              </Flex>
            ) : null}
          </HistoryCard>

          {/* Rewards Earned Card */}
          <HistoryCard>
            <Flex alignItems="center" justifyContent="space-between">
              <Text fontSize={14} color={theme.subText}>
                {t`Rewards Earned`}
              </Text>
              {loading ? (
                <PositionSkeleton width={60} height={20} />
              ) : (
                <Text fontSize={14} color={theme.text}>
                  {formatDisplayNumber(totalRewardsEarned, { style: 'currency', significantDigits: 4 })}
                </Text>
              )}
            </Flex>
            <Flex flexDirection="column" sx={{ gap: '4px' }}>
              {/* KyberSwap Rewards (EG + LM) */}
              {((rewardInfoThisPosition?.egTokens || []).length > 0 ||
                (rewardInfoThisPosition?.lmTokens || []).length > 0) && (
                <Flex alignItems="flex-start" justifyContent="space-between" flexWrap="wrap">
                  <Text fontSize={14} color="#737373">
                    {t`KyberSwap Rewards`}
                  </Text>
                  <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
                    {[...(rewardInfoThisPosition?.egTokens || []), ...(rewardInfoThisPosition?.lmTokens || [])].map(
                      token => (
                        <Flex key={token.symbol} alignItems="center" sx={{ gap: '4px' }}>
                          <TokenLogo src={token.logo} size={16} />
                          <Text fontSize={14} color={theme.text}>
                            {formatDisplayNumber(token.totalAmount, { significantDigits: 4 })} {token.symbol}
                          </Text>
                        </Flex>
                      ),
                    )}
                  </Flex>
                </Flex>
              )}
              {/* Merkl/Bonus rewards */}
              {merklRewards.length > 0 && (
                <Flex alignItems="flex-start" justifyContent="space-between" flexWrap="wrap">
                  <Text fontSize={14} color="#737373">
                    {t`Bonus Rewards`}
                  </Text>
                  <Flex sx={{ gap: '12px' }} flexWrap="wrap">
                    {merklRewards.map(token => (
                      <Flex key={token.symbol} alignItems="center" sx={{ gap: '4px' }}>
                        <TokenLogo src={token.logo} size={16} />
                        <Text fontSize={14} color={theme.text}>
                          {formatDisplayNumber(token.totalAmount, { significantDigits: 4 })} {token.symbol}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Flex>
              )}
              {/* No rewards */}
              {!(rewardInfoThisPosition?.egTokens || []).length &&
                !(rewardInfoThisPosition?.lmTokens || []).length &&
                !merklRewards.length && (
                  <Text fontSize={14} color="#737373">
                    --
                  </Text>
                )}
            </Flex>
          </HistoryCard>
        </Flex>
      </Flex>

      {/* Position History Section */}
      <Flex flexDirection="column" sx={{ gap: '24px' }}>
        <HistorySectionHeader>
          <Text fontSize={16} fontWeight={500} color={theme.text}>
            {t`Position History`}
          </Text>
        </HistorySectionHeader>

        {/* Created Time */}
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize={14} color={theme.subText}>
            {t`Created Time`}
          </Text>
          {loading ? (
            <PositionSkeleton width={140} height={20} />
          ) : (
            <Text fontSize={14} color={theme.text}>
              {createdTime}
            </Text>
          )}
        </Flex>

        {/* Liquidity Source - from first DEPOSIT */}
        {position && liquiditySourceEntry && (
          <Flex alignItems="flex-start" justifyContent="space-between">
            <Text fontSize={14} color={theme.subText}>
              {t`Liquidity Source`}
            </Text>
            <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
              <Flex alignItems="center" sx={{ gap: '8px' }}>
                <Text fontSize={14} color="#737373">
                  {t`Value`}
                </Text>
                <Text fontSize={14} color={theme.text}>
                  {formatDisplayNumber(getActionTotalValue(liquiditySourceEntry), {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                </Text>
              </Flex>
              <Text fontSize={14} color={theme.text}>
                {getActionTokensSummary(liquiditySourceEntry)
                  .map(t => `${formatDisplayNumber(t.amount, { significantDigits: 4 })} ${t.symbol}`)
                  .join(' + ')}
              </Text>
              {liquiditySourceEntry.txHash && (
                <Flex alignItems="center" sx={{ gap: '6px' }}>
                  <Text fontSize={14} color="#737373">
                    {t`Tnx Hash`}
                  </Text>
                  <Text
                    fontSize={14}
                    fontFamily="'Courier Prime', monospace"
                    color={theme.blue2}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => window.open(explorerUrl + '/tx/' + liquiditySourceEntry.txHash, '_blank')}
                  >
                    {shortenTxHash(liquiditySourceEntry.txHash)}
                  </Text>
                  <CopyHelper color={theme.blue2} size={14} toCopy={liquiditySourceEntry.txHash} />
                </Flex>
              )}
            </Flex>
          </Flex>
        )}

        {/* Past Actions */}
        {pastActions.length > 0 && (
          <Flex alignItems="flex-start" justifyContent="space-between">
            <Text fontSize={14} color={theme.subText}>
              {t`Past Actions`}
            </Text>
            <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
              {pastActions.map((entry, i) => {
                const totalValue = getActionTotalValue(entry)
                const label = getActionLabel(entry.type)

                return (
                  <Flex key={i} flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
                    <Text fontSize={14} color={theme.text}>
                      {label}
                    </Text>
                    {totalValue > 0 && (
                      <Flex alignItems="center" sx={{ gap: '8px' }}>
                        <Text fontSize={14} color="#737373">
                          {t`Value`}
                        </Text>
                        <Text fontSize={14} color={theme.text}>
                          {formatDisplayNumber(totalValue, { style: 'currency', significantDigits: 4 })}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                )
              })}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default AnalyticTab
