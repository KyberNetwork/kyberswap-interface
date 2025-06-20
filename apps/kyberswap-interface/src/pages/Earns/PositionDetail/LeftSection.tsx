import { ShareType } from '@kyber/ui'
import { t } from '@lingui/macro'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { PositionSkeleton } from 'pages/Earns/PositionDetail'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import RewardSection from 'pages/Earns/PositionDetail/RewardSection'
import { InfoLeftColumn, InfoSection, PositionAction, VerticalDivider } from 'pages/Earns/PositionDetail/styles'
import {
  CoreProtocol,
  EXCHANGES_SUPPORT_COLLECT_FEE,
  Exchange,
  POSSIBLE_FARMING_PROTOCOLS,
} from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import { ParsedPosition } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const LeftSection = ({
  position,
  onFetchUnclaimedFee,
  totalLiquiditySection,
  aprSection,
  initialLoading,
  shareBtn,
}: {
  position?: ParsedPosition
  onFetchUnclaimedFee: () => void
  totalLiquiditySection: React.ReactNode
  aprSection: React.ReactNode
  initialLoading: boolean
  shareBtn: (type: ShareType) => React.ReactNode
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { protocol, chainId } = useParams()

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    claiming: feesClaiming,
  } = useCollectFees({
    refetchAfterCollect: () => onFetchUnclaimedFee(),
  })

  const isUniv2 = isForkFrom(protocol as Exchange, CoreProtocol.UniswapV2)
  const isFarmingPossible = POSSIBLE_FARMING_PROTOCOLS.includes(protocol as Exchange)
  const nativeToken = chainId ? NETWORKS_INFO[Number(chainId) as keyof typeof NETWORKS_INFO]?.nativeToken : undefined

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
              <Text>
                {initialLoading ? (
                  <PositionSkeleton width={90} height={19} />
                ) : (position?.earning.in24h || position?.earning.in24h === 0) && !isUniv2 ? (
                  formatDisplayNumber(position?.earning.in24h, { significantDigits: 4, style: 'currency' })
                ) : (
                  '--'
                )}
              </Text>
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                7 {t`days`}
              </Text>
              <Text>
                {initialLoading ? (
                  <PositionSkeleton width={90} height={19} />
                ) : (position?.earning.in7d || position?.earning.in7d === 0) && !isUniv2 ? (
                  formatDisplayNumber(position?.earning.in7d, { significantDigits: 4, style: 'currency' })
                ) : (
                  '--'
                )}
              </Text>
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
                ) : (position?.earning.earned || position?.earning.earned === 0) && position?.earning.earned >= 0 ? (
                  formatDisplayNumber(position?.earning.earned, { style: 'currency', significantDigits: 4 })
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
        {EXCHANGES_SUPPORT_COLLECT_FEE[protocol as Exchange] ? (
          <InfoSection>
            <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
              <Text fontSize={14} color={theme.subText} marginTop={1}>
                {t`Unclaimed Fees`}
              </Text>

              {initialLoading ? (
                <PositionSkeleton width={90} height={21} />
              ) : (
                <Text fontSize={18}>
                  {position?.unclaimedFees
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
                ) : (
                  <Flex alignItems={'center'} sx={{ gap: '6px' }} marginBottom={1}>
                    <Text>{formatDisplayNumber(position?.token0.unclaimedAmount, { significantDigits: 4 })}</Text>
                    <Text>{position?.token0.isNative ? nativeToken?.symbol : position?.token0.symbol}</Text>
                    <Text fontSize={14} color={theme.subText}>
                      {formatDisplayNumber(position?.token0.unclaimedValue, {
                        style: 'currency',
                        significantDigits: 4,
                      })}
                    </Text>
                  </Flex>
                )}

                {initialLoading ? (
                  <PositionSkeleton width={120} height={19} style={{ marginBottom: 1 }} />
                ) : (
                  <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                    <Text>{formatDisplayNumber(position?.token1.unclaimedAmount, { significantDigits: 4 })}</Text>
                    <Text>{position?.token1.isNative ? nativeToken?.symbol : position?.token1.symbol}</Text>
                    <Text fontSize={14} color={theme.subText}>
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
                disabled={initialLoading || position?.unclaimedFees === 0 || feesClaiming}
                onClick={() =>
                  !initialLoading &&
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
          <RewardSection position={position} initialLoading={initialLoading} shareBtn={shareBtn} />
        )}

        {/* Position History */}
        {!isUniv2 && <PositionHistory position={position} />}
      </InfoLeftColumn>
    </>
  )
}

export default LeftSection
