import { t } from '@lingui/macro'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import RewardSection from 'pages/Earns/PositionDetail/RewardSection'
import { InfoLeftColumn, InfoSection, PositionAction, VerticalDivider } from 'pages/Earns/PositionDetail/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EARN_DEXES, Exchange, LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import { ParsedPosition } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const LeftSection = ({
  position,
  onFetchUnclaimedFee,
  totalLiquiditySection,
  aprSection,
  initialLoading,
  isNotAccountOwner,
  shareBtn,
  refetchPositions,
}: {
  position?: ParsedPosition
  onFetchUnclaimedFee: () => void
  totalLiquiditySection: React.ReactNode
  aprSection: React.ReactNode
  initialLoading: boolean
  isNotAccountOwner: boolean
  shareBtn: (size?: number) => React.ReactNode
  refetchPositions: () => void
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { exchange, chainId } = useParams()

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    claiming: feesClaiming,
  } = useCollectFees({
    refetchAfterCollect: () => onFetchUnclaimedFee(),
  })

  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2
  const isFarmingPossible = EARN_DEXES[exchange as Exchange]?.farmingSupported || false
  const nativeToken = chainId ? NETWORKS_INFO[Number(chainId) as keyof typeof NETWORKS_INFO]?.nativeToken : undefined

  const isUnfinalized = position?.isUnfinalized

  return (
    <>
      {claimFeesModal}

      <InfoLeftColumn halfWidth={isUniv2}>
        {/* Total Liquidity */}
        {upToSmall
          ? totalLiquiditySection
          : initialLoading
          ? !isFarmingPossible
            ? totalLiquiditySection
            : null
          : !position?.pool.isFarming && !position?.rewards.claimableUsdValue
          ? totalLiquiditySection
          : null}

        {/* Est. Position APR */}
        {upToSmall
          ? aprSection
          : initialLoading
          ? !isFarmingPossible
            ? aprSection
            : null
          : !position?.pool.isFarming && !position?.rewards.claimableUsdValue
          ? aprSection
          : null}

        {/* Fee Earn */}
        <InfoSection>
          <Text fontSize={14} color={theme.subText} marginBottom={3}>
            {t`Fees Earn`}
          </Text>
          <Flex alignItems={'center'} justifyContent={'space-between'}>
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                1 {t`day`}
              </Text>

              {initialLoading ? (
                <PositionSkeleton width={90} height={19} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={70} height={19} text="Finalizing..." />
              ) : (position?.earning.in24h || position?.earning.in24h === 0) && !isUniv2 ? (
                <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '120px' }}>
                  {formatDisplayNumber(position?.earning.in24h, { significantDigits: 4, style: 'currency' })}
                </Text>
              ) : (
                '--'
              )}
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                7 {t`days`}
              </Text>

              {initialLoading ? (
                <PositionSkeleton width={90} height={19} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={70} height={19} text="Finalizing..." />
              ) : (position?.earning.in7d || position?.earning.in7d === 0) && !isUniv2 ? (
                <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '120px' }}>
                  {formatDisplayNumber(position?.earning.in7d, { significantDigits: 4, style: 'currency' })}
                </Text>
              ) : (
                '--'
              )}
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                {t`All`}
              </Text>
              <Text
                fontSize={18}
                color={position?.earning.earned && position.earning.earned > 0 ? theme.primary : theme.text}
              >
                {initialLoading ? (
                  <PositionSkeleton width={90} height={21} />
                ) : isUnfinalized ? (
                  <PositionSkeleton width={70} height={19} text="Finalizing..." />
                ) : (position?.earning.earned || position?.earning.earned === 0) && position?.earning.earned >= 0 ? (
                  <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}>
                    {formatDisplayNumber(position?.earning.earned, { style: 'currency', significantDigits: 4 })}
                  </Text>
                ) : position?.earning.earned && position?.earning.earned < 0 ? (
                  0
                ) : (
                  '--'
                )}
              </Text>
            </Flex>
          </Flex>
        </InfoSection>

        {/* Claim Fees */}
        {EARN_DEXES[exchange as Exchange].collectFeeSupported ? (
          <InfoSection>
            <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
              <Text fontSize={14} color={theme.subText} marginTop={1}>
                {t`Unclaimed Fees`}
              </Text>

              {initialLoading ? (
                <PositionSkeleton width={90} height={21} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={90} height={21} text="Finalizing..." />
              ) : (
                <Text fontSize={18} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '160px' }}>
                  {position?.unclaimedFees || position?.unclaimedFees === 0
                    ? formatDisplayNumber(position?.unclaimedFees, {
                        significantDigits: 4,
                        style: 'currency',
                      })
                    : '--'}
                </Text>
              )}
            </Flex>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <div>
                {initialLoading ? (
                  <PositionSkeleton width={120} height={19} style={{ marginBottom: 4 }} />
                ) : isUnfinalized ? (
                  <PositionSkeleton width={120} height={19} style={{ marginBottom: 4 }} text="Finalizing..." />
                ) : (
                  <Flex alignItems={'center'} sx={{ gap: '6px' }} marginBottom={1}>
                    <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
                      {formatDisplayNumber(position?.token0.unclaimedAmount, { significantDigits: 4 })}
                    </Text>
                    <Text>{position?.token0.isNative ? nativeToken?.symbol : position?.token0.symbol}</Text>
                    <Text fontSize={14} color={theme.subText} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
                      {formatDisplayNumber(position?.token0.unclaimedValue, {
                        style: 'currency',
                        significantDigits: 4,
                      })}
                    </Text>
                  </Flex>
                )}

                {initialLoading ? (
                  <PositionSkeleton width={120} height={19} style={{ marginBottom: 1 }} />
                ) : isUnfinalized ? (
                  <PositionSkeleton width={120} height={19} style={{ marginBottom: 1 }} text="Finalizing..." />
                ) : (
                  <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                    <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
                      {formatDisplayNumber(position?.token1.unclaimedAmount, { significantDigits: 4 })}
                    </Text>
                    <Text>{position?.token1.isNative ? nativeToken?.symbol : position?.token1.symbol}</Text>
                    <Text fontSize={14} color={theme.subText} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
                      {formatDisplayNumber(position?.token1.unclaimedValue, {
                        style: 'currency',
                        significantDigits: 4,
                      })}
                    </Text>
                  </Flex>
                )}
              </div>
              <PositionAction
                small
                outline
                mobileAutoWidth
                load={feesClaiming}
                disabled={
                  initialLoading || isNotAccountOwner || isUnfinalized || position?.unclaimedFees === 0 || feesClaiming
                }
                onClick={() =>
                  !initialLoading &&
                  !isUnfinalized &&
                  position?.unclaimedFees &&
                  position?.unclaimedFees > 0 &&
                  !feesClaiming &&
                  onOpenClaimFees(position)
                }
              >
                {feesClaiming && <Loader size="14px" />}
                {feesClaiming ? t`Claiming` : t`Claim`}
              </PositionAction>
            </Flex>
          </InfoSection>
        ) : null}

        {/* Rewards */}
        {(position?.pool.isFarming ||
          (initialLoading && isFarmingPossible) ||
          Number(position?.rewards.claimableUsdValue || 0) > 0) && (
          <RewardSection
            position={position}
            initialLoading={initialLoading}
            shareBtn={shareBtn}
            refetchPositions={refetchPositions}
          />
        )}

        {/* Position History */}
        {!isUniv2 && <PositionHistory position={position} />}
      </InfoLeftColumn>
    </>
  )
}

export default LeftSection
