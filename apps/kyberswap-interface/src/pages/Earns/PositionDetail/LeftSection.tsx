import { t } from '@lingui/macro'
import { useParams } from 'react-router-dom'

import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import RewardSection from 'pages/Earns/PositionDetail/RewardSection'
import { CardDivider, ClaimButton, DarkCard, LeftColumn } from 'pages/Earns/PositionDetail/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import { formatDisplayNumber } from 'utils/numbers'

const LeftSection = () => {
  const { position, initialLoading, isNotAccountOwner, handleFetchUnclaimedFee } = usePositionDetailContext()

  const { exchange, chainId } = useParams()

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    pendingClaimKeys: pendingFeeClaimKeys,
  } = useCollectFees({
    refetchAfterCollect: () => handleFetchUnclaimedFee(),
  })

  const nativeToken = chainId ? NETWORKS_INFO[Number(chainId) as keyof typeof NETWORKS_INFO]?.nativeToken : undefined
  const isUnfinalized = position?.isUnfinalized

  const claimKey = position ? `${position.chain.id}:${position.tokenId}` : ''
  const isFeesClaiming = claimKey ? pendingFeeClaimKeys.includes(claimKey) : false

  const isFarmingPossible = EARN_DEXES[exchange as Exchange]?.farmingSupported || false
  // KEM farming rewards drive the in-progress / cycle / claim UI. Merkl bonus alone (no farming)
  // still surfaces a reward card, but only its total + claimed/claimable, not the farming controls.
  const hasFarmingReward = !!(
    position?.pool.isFarming ||
    (initialLoading && isFarmingPossible) ||
    Number(position?.rewards.inProgressUsdValue || 0) > 0 ||
    Number(position?.rewards.claimableUsdValue || 0) > 0
  )
  const showRewards = hasFarmingReward || (position?.bonusApr || 0) > 0

  return (
    <>
      {claimFeesModal}

      <LeftColumn>
        {EARN_DEXES[exchange as Exchange]?.collectFeeSupported && (
          <DarkCard>
            <div className="flex items-center justify-between">
              <span className="text-base uppercase text-subText">{t`Fee Earn`}</span>
              {initialLoading ? (
                <PositionSkeleton width={80} height={24} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={80} height={24} text={t`Finalizing...`} />
              ) : (
                <span className="text-base text-text">
                  <AnimatedNumber
                    value={
                      position?.earning.earned !== undefined && position.earning.earned >= 0
                        ? formatDisplayNumber(position.earning.earned, { style: 'currency', significantDigits: 4 })
                        : '--'
                    }
                  />
                </span>
              )}
            </div>

            <CardDivider />

            <div className="flex items-center justify-between">
              <span className="text-base uppercase text-subText">{t`Unclaimed Fee`}</span>
              {initialLoading ? (
                <PositionSkeleton width={80} height={24} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={80} height={24} text={t`Finalizing...`} />
              ) : (
                <span className="text-xl font-medium text-text">
                  <AnimatedNumber
                    value={
                      position?.unclaimedFees !== undefined
                        ? formatDisplayNumber(position.unclaimedFees, { style: 'currency', significantDigits: 4 })
                        : '--'
                    }
                  />
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                {initialLoading ? (
                  <>
                    <PositionSkeleton width={120} height={19} />
                    <PositionSkeleton width={120} height={19} />
                  </>
                ) : isUnfinalized ? (
                  <>
                    <PositionSkeleton width={120} height={19} text={t`Finalizing...`} />
                    <PositionSkeleton width={120} height={19} text={t`Finalizing...`} />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <TokenLogo src={position?.token0.logo} size={16} />
                      <span className="truncate text-base text-text">
                        {formatDisplayNumber(position?.token0.unclaimedAmount, { significantDigits: 4 })}{' '}
                        {position?.token0.isNative ? nativeToken?.symbol : position?.token0.symbol}
                      </span>
                      <span className="text-sm text-subText">
                        {formatDisplayNumber(position?.token0.unclaimedValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TokenLogo src={position?.token1.logo} size={16} />
                      <span className="truncate text-base text-text">
                        {formatDisplayNumber(position?.token1.unclaimedAmount, { significantDigits: 4 })}{' '}
                        {position?.token1.isNative ? nativeToken?.symbol : position?.token1.symbol}
                      </span>
                      <span className="text-sm text-subText">
                        {formatDisplayNumber(position?.token1.unclaimedValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <ClaimButton
                disabled={
                  !position ||
                  initialLoading ||
                  isNotAccountOwner ||
                  isUnfinalized ||
                  position.unclaimedFees === 0 ||
                  isFeesClaiming
                }
                onClick={() => position && onOpenClaimFees(position)}
              >
                {isFeesClaiming ? (
                  <div className="flex items-center gap-1">
                    <Loader size="12px" />
                    {t`Claiming`}
                  </div>
                ) : (
                  t`Claim`
                )}
              </ClaimButton>
            </div>
          </DarkCard>
        )}

        {showRewards && <RewardSection hasFarmingReward={hasFarmingReward} />}
      </LeftColumn>
    </>
  )
}

export default LeftSection
