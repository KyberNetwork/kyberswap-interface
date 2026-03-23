import { t } from '@lingui/macro'
import { useParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import RewardSection from 'pages/Earns/PositionDetail/RewardSection'
import { CardDivider, ClaimButton, DarkCard, LeftColumn } from 'pages/Earns/PositionDetail/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EARN_DEXES, Exchange, LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import { ParsedPosition } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const LeftSection = ({
  position,
  initialLoading,
  isNotAccountOwner,
  onFetchUnclaimedFee,
  shareBtn,
  refetchPositions,
}: {
  position?: ParsedPosition
  initialLoading: boolean
  isNotAccountOwner: boolean
  onFetchUnclaimedFee: () => void
  shareBtn: (size?: number) => React.ReactNode
  refetchPositions: () => void
}) => {
  const theme = useTheme()
  const { exchange, chainId } = useParams()

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    pendingClaimKeys: pendingFeeClaimKeys,
  } = useCollectFees({
    refetchAfterCollect: () => onFetchUnclaimedFee(),
  })

  const nativeToken = chainId ? NETWORKS_INFO[Number(chainId) as keyof typeof NETWORKS_INFO]?.nativeToken : undefined
  const isUnfinalized = position?.isUnfinalized

  const claimKey = position ? `${position.chain.id}:${position.tokenId}` : ''
  const isFeesClaiming = claimKey ? pendingFeeClaimKeys.includes(claimKey) : false

  const isFarmingPossible = EARN_DEXES[exchange as Exchange]?.farmingSupported || false
  const showRewards =
    position?.pool.isFarming ||
    (initialLoading && isFarmingPossible) ||
    Number(position?.rewards.inProgressUsdValue || 0) > 0 ||
    Number(position?.rewards.claimableUsdValue || 0) > 0

  return (
    <>
      {claimFeesModal}

      <LeftColumn>
        {/* Fee Earn Card */}
        {EARN_DEXES[exchange as Exchange]?.collectFeeSupported && (
          <DarkCard>
            {/* Total Fee Earn */}
            <Flex alignItems="center" justifyContent="space-between">
              <Text fontSize={16} color={theme.subText} style={{ textTransform: 'uppercase' }}>
                {t`Fee Earn`}
              </Text>
              {initialLoading ? (
                <PositionSkeleton width={80} height={24} />
              ) : (
                <Text fontSize={16} color={theme.text}>
                  {position?.earning.earned !== undefined && position.earning.earned >= 0
                    ? formatDisplayNumber(position.earning.earned, { style: 'currency', significantDigits: 4 })
                    : '--'}
                </Text>
              )}
            </Flex>

            <CardDivider />

            {/* Unclaimed Fees */}
            <Flex alignItems="center" justifyContent="space-between">
              <Text fontSize={16} color={theme.subText} style={{ textTransform: 'uppercase' }}>
                {t`Unclaimed Fee`}
              </Text>
              {initialLoading ? (
                <PositionSkeleton width={80} height={24} />
              ) : (
                <Text fontSize={20} fontWeight={500} color={theme.text}>
                  {position?.unclaimedFees !== undefined
                    ? formatDisplayNumber(position.unclaimedFees, { style: 'currency', significantDigits: 4 })
                    : '--'}
                </Text>
              )}
            </Flex>

            <Flex alignItems="center" justifyContent="space-between">
              <Flex flexDirection="column" sx={{ gap: '4px' }}>
                {initialLoading ? (
                  <>
                    <PositionSkeleton width={120} height={19} />
                    <PositionSkeleton width={120} height={19} />
                  </>
                ) : (
                  <>
                    <Flex alignItems="center" sx={{ gap: '8px' }}>
                      <TokenLogo src={position?.token0.logo} size={16} />
                      <Text fontSize={16} color={theme.text} sx={LIMIT_TEXT_STYLES}>
                        {formatDisplayNumber(position?.token0.unclaimedAmount, { significantDigits: 4 })}{' '}
                        {position?.token0.isNative ? nativeToken?.symbol : position?.token0.symbol}
                      </Text>
                      <Text fontSize={14} color={theme.subText}>
                        {formatDisplayNumber(position?.token0.unclaimedValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </Text>
                    </Flex>
                    <Flex alignItems="center" sx={{ gap: '8px' }}>
                      <TokenLogo src={position?.token1.logo} size={16} />
                      <Text fontSize={16} color={theme.text} sx={LIMIT_TEXT_STYLES}>
                        {formatDisplayNumber(position?.token1.unclaimedAmount, { significantDigits: 4 })}{' '}
                        {position?.token1.isNative ? nativeToken?.symbol : position?.token1.symbol}
                      </Text>
                      <Text fontSize={14} color={theme.subText}>
                        {formatDisplayNumber(position?.token1.unclaimedValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>

              <ClaimButton
                disabled={
                  initialLoading ||
                  isNotAccountOwner ||
                  isUnfinalized ||
                  position?.unclaimedFees === 0 ||
                  isFeesClaiming
                }
                onClick={() =>
                  !initialLoading &&
                  !isUnfinalized &&
                  position?.unclaimedFees &&
                  position.unclaimedFees > 0 &&
                  !isFeesClaiming &&
                  onOpenClaimFees(position)
                }
              >
                {isFeesClaiming ? (
                  <Flex alignItems="center" sx={{ gap: '4px' }}>
                    <Loader size="12px" />
                    {t`Claiming`}
                  </Flex>
                ) : (
                  t`Claim`
                )}
              </ClaimButton>
            </Flex>
          </DarkCard>
        )}

        {/* Total Reward Card - using existing RewardSection component */}
        {showRewards && (
          <RewardSection
            position={position}
            initialLoading={initialLoading}
            shareBtn={shareBtn}
            refetchPositions={refetchPositions}
          />
        )}
      </LeftColumn>
    </>
  )
}

export default LeftSection
