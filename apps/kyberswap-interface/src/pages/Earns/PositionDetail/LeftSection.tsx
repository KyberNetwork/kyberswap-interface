import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import RewardSection from 'pages/Earns/PositionDetail/RewardSection'
import { InfoLeftColumn, InfoSection, PositionAction, VerticalDivider } from 'pages/Earns/PositionDetail/styles'
import { CoreProtocol, DEXES_SUPPORT_COLLECT_FEE } from 'pages/Earns/constants'
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
}: {
  position: ParsedPosition
  onFetchUnclaimedFee: () => void
  totalLiquiditySection: React.ReactNode
  aprSection: React.ReactNode
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    claiming: feesClaiming,
  } = useCollectFees({
    refetchAfterCollect: () => onFetchUnclaimedFee(),
  })

  const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)
  const nativeToken = NETWORKS_INFO[position.chain.id as keyof typeof NETWORKS_INFO].nativeToken

  return (
    <>
      {claimFeesModal}

      <InfoLeftColumn halfWidth={isUniv2}>
        {/* Total Liquidity */}
        {upToSmall || !position.pool.isFarming ? totalLiquiditySection : null}

        {/* Est. Position APR */}
        {upToSmall || !position.pool.isFarming ? aprSection : null}

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
                {(position.earning.in24h || position.earning.in24h === 0) && !isUniv2
                  ? formatDisplayNumber(position.earning.in24h, { significantDigits: 4, style: 'currency' })
                  : '--'}
              </Text>
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                7 {t`days`}
              </Text>
              <Text>
                {(position.earning.in7d || position.earning.in7d === 0) && !isUniv2
                  ? formatDisplayNumber(position.earning.in7d, { significantDigits: 4, style: 'currency' })
                  : '--'}
              </Text>
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                {t`All`}
              </Text>
              <Text fontSize={18} color={position.earning.earned > 0 ? theme.primary : theme.text}>
                {(position.earning.earned || position.earning.earned === 0) && position.earning.earned >= 0
                  ? formatDisplayNumber(position.earning.earned, { style: 'currency', significantDigits: 4 })
                  : position.earning.earned && position.earning.earned < 0
                  ? 0
                  : '--'}
              </Text>
            </Flex>
          </Flex>
        </InfoSection>

        {/* Claim Fees */}
        {DEXES_SUPPORT_COLLECT_FEE[position.dex.id] ? (
          <InfoSection>
            <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
              <Text fontSize={14} color={theme.subText} marginTop={1}>
                {t`Unclaimed Fees`}
              </Text>
              <Text fontSize={18}>
                {position.unclaimedFees
                  ? formatDisplayNumber(position.unclaimedFees, {
                      significantDigits: 4,
                      style: 'currency',
                    })
                  : '--'}
              </Text>
            </Flex>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <div>
                <Flex alignItems={'center'} sx={{ gap: '6px' }} marginBottom={1}>
                  <Text>{formatDisplayNumber(position.token0.unclaimedAmount, { significantDigits: 4 })}</Text>
                  <Text>{position.token0.isNative ? nativeToken.symbol : position.token0.symbol}</Text>
                  <Text fontSize={14} color={theme.subText}>
                    {formatDisplayNumber(position.token0.unclaimedValue, {
                      style: 'currency',
                      significantDigits: 4,
                    })}
                  </Text>
                </Flex>
                <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                  <Text>{formatDisplayNumber(position.token1.unclaimedAmount, { significantDigits: 4 })}</Text>
                  <Text>{position.token1.isNative ? nativeToken.symbol : position.token1.symbol}</Text>
                  <Text fontSize={14} color={theme.subText}>
                    {formatDisplayNumber(position.token1.unclaimedValue, {
                      style: 'currency',
                      significantDigits: 4,
                    })}
                  </Text>
                </Flex>
              </div>
              <PositionAction
                small
                outline
                mobileAutoWidth
                load={feesClaiming}
                disabled={position.unclaimedFees === 0 || feesClaiming}
                onClick={() => position.unclaimedFees > 0 && !feesClaiming && onOpenClaimFees(position)}
              >
                {feesClaiming && <Loader size="14px" />}
                {feesClaiming ? t`Claiming` : t`Claim`}
              </PositionAction>
            </Flex>
          </InfoSection>
        ) : null}

        {/* Rewards */}
        {position.pool.isFarming && <RewardSection position={position} />}

        {/* Position History */}
        {!isUniv2 && <PositionHistory position={position} />}
      </InfoLeftColumn>
    </>
  )
}

export default LeftSection
