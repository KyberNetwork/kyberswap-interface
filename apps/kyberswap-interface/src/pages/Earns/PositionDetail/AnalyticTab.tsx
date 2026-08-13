import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { usePositionHistoryQuery } from 'services/earn'
import type { PositionHistory } from 'services/earn/types'

import CopyHelper from 'components/Copy'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import { HistoryCard, HistorySectionHeader, PastActionsList } from 'pages/Earns/PositionDetail/styles'
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

  // Past actions = all entries, newest first
  const pastActions = useMemo(() => [...chronologicalHistory].reverse(), [chronologicalHistory])

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <HistorySectionHeader>
          <span className="text-base font-medium text-text">{t`Earn History`}</span>
        </HistorySectionHeader>

        <div className="flex items-start justify-between">
          <span className="text-sm text-subText">{t`Total Earned`}</span>
          {loading ? (
            <PositionSkeleton width={80} height={20} />
          ) : (
            <span className="text-right text-sm text-text">
              {formatDisplayNumber(totalEarned, { style: 'currency', significantDigits: 4 })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <HistoryCard>
            <div className="flex items-center justify-between">
              <span className="text-sm text-subText">{t`Fees Earned`}</span>
              {loading ? (
                <PositionSkeleton width={60} height={20} />
              ) : (
                <span className="text-sm text-text">
                  {formatDisplayNumber(totalFeeEarned, { style: 'currency', significantDigits: 4 })}
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex flex-col items-end gap-1">
                <PositionSkeleton width={100} height={16} />
                <PositionSkeleton width={100} height={16} />
              </div>
            ) : position ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <TokenLogo src={position.token0.logo} size={16} />
                  <span className="text-sm text-text">
                    {formatDisplayNumber(position.token0.unclaimedAmount || 0, { significantDigits: 4 })}{' '}
                    {position.token0.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TokenLogo src={position.token1.logo} size={16} />
                  <span className="text-sm text-text">
                    {formatDisplayNumber(position.token1.unclaimedAmount || 0, { significantDigits: 4 })}{' '}
                    {position.token1.symbol}
                  </span>
                </div>
              </div>
            ) : null}
          </HistoryCard>

          <HistoryCard>
            <div className="flex items-center justify-between">
              <span className="text-sm text-subText">{t`Rewards Earned`}</span>
              {loading ? (
                <PositionSkeleton width={60} height={20} />
              ) : (
                <span className="text-sm text-text">
                  {formatDisplayNumber(totalRewardsEarned, { style: 'currency', significantDigits: 4 })}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {((rewardInfoThisPosition?.egTokens || []).length > 0 ||
                (rewardInfoThisPosition?.lmTokens || []).length > 0) && (
                <div className="flex flex-wrap items-start justify-between">
                  <span className="text-sm" style={{ color: '#737373' }}>
                    {t`KyberSwap Rewards`}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    {[...(rewardInfoThisPosition?.egTokens || []), ...(rewardInfoThisPosition?.lmTokens || [])].map(
                      token => (
                        <div key={token.symbol} className="flex items-center gap-1">
                          <TokenLogo src={token.logo} size={16} />
                          <span className="text-sm text-text">
                            {formatDisplayNumber(token.totalAmount, { significantDigits: 4 })} {token.symbol}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
              {merklRewards.length > 0 && (
                <div className="flex flex-wrap items-start justify-between">
                  <span className="text-sm" style={{ color: '#737373' }}>
                    {t`Bonus Rewards`}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {merklRewards.map(token => (
                      <div key={token.symbol} className="flex items-center gap-1">
                        <TokenLogo src={token.logo} size={16} />
                        <span className="text-sm text-text">
                          {formatDisplayNumber(token.totalAmount, { significantDigits: 4 })} {token.symbol}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!(rewardInfoThisPosition?.egTokens || []).length &&
                !(rewardInfoThisPosition?.lmTokens || []).length &&
                !merklRewards.length && (
                  <span className="text-sm" style={{ color: '#737373' }}>
                    --
                  </span>
                )}
            </div>
          </HistoryCard>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <HistorySectionHeader>
          <span className="text-base font-medium text-text">{t`Position History`}</span>
        </HistorySectionHeader>

        <div className="flex items-center justify-between">
          <span className="text-sm text-subText">{t`Created Time`}</span>
          {loading ? (
            <PositionSkeleton width={140} height={20} />
          ) : (
            <span className="text-sm text-text">{createdTime}</span>
          )}
        </div>

        {position && liquiditySourceEntry && (
          <div className="flex items-start justify-between">
            <span className="text-sm text-subText">{t`Liquidity Source`}</span>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#737373' }}>
                  {t`Value`}
                </span>
                <span className="text-sm text-text">
                  {formatDisplayNumber(getActionTotalValue(liquiditySourceEntry), {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                </span>
              </div>
              <span className="text-sm text-text">
                {getActionTokensSummary(liquiditySourceEntry)
                  .map(t => `${formatDisplayNumber(t.amount, { significantDigits: 4 })} ${t.symbol}`)
                  .join(' + ')}
              </span>
              {liquiditySourceEntry.txHash && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm" style={{ color: '#737373' }}>
                    {t`Tnx Hash`}
                  </span>
                  <span
                    className="cursor-pointer text-sm text-blue2"
                    style={{ fontFamily: "'Courier Prime', monospace" }}
                    onClick={() => window.open(explorerUrl + '/tx/' + liquiditySourceEntry.txHash, '_blank')}
                  >
                    {shortenTxHash(liquiditySourceEntry.txHash)}
                  </span>
                  <CopyHelper className="text-blue2" size={14} toCopy={liquiditySourceEntry.txHash} />
                </div>
              )}
            </div>
          </div>
        )}

        {pastActions.length > 0 && (
          <div className="flex items-start justify-between">
            <span className="text-sm text-subText">{t`Past Actions`}</span>
            <PastActionsList>
              {pastActions.map((entry, i) => {
                const totalValue = getActionTotalValue(entry)
                const label = getActionLabel(entry.type)

                return (
                  <div key={i} className="flex flex-col items-end gap-1">
                    <span className="text-sm text-text">{label}</span>
                    {totalValue > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: '#737373' }}>
                          {t`Value`}
                        </span>
                        <span className="text-sm text-text">
                          {formatDisplayNumber(totalValue, { style: 'currency', significantDigits: 4 })}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </PastActionsList>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyticTab
