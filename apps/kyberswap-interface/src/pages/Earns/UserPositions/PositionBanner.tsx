import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { inProgressRewardTooltip, totalRewardTooltip } from 'pages/Earns/PositionDetail/RewardSection'
import { PositionAction } from 'pages/Earns/PositionDetail/styles'
import {
  BannerContainer,
  BannerDataItem,
  BannerDivider,
  BannerWrapper,
  RewardBannerDetailWrapper,
  RewardBannerWrapper,
} from 'pages/Earns/UserPositions/styles'
import { LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ParsedPosition } from 'pages/Earns/types'
import { aggregateFeeFromPositions, aggregateRewardFromPositions } from 'pages/Earns/utils/position'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const BannerSkeleton = ({
  width,
  height,
  style,
}: {
  width: number
  height: number
  style?: React.CSSProperties
}) => {
  const theme = useTheme()

  return (
    <Skeleton
      width={width}
      height={height}
      baseColor={'#141d1b'}
      highlightColor={rgba(theme.buttonGray, 0.5)}
      borderRadius="1rem"
      style={style}
    />
  )
}

export default function PositionBanner({
  positions,
  initialLoading,
}: {
  positions: Array<ParsedPosition>
  initialLoading: boolean
}) {
  const theme = useTheme()
  const { claimAllRewardsModal, onOpenClaimAllRewards } = useKemRewards()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const {
    totalUsdValue,
    claimedUsdValue,
    inProgressUsdValue,
    pendingUsdValue,
    vestingUsdValue,
    claimableUsdValue,
    egTokens,
    lmTokens,
    tokens,
  } = useMemo(() => aggregateRewardFromPositions(positions), [positions])

  const {
    totalValue: totalFeeValue,
    totalEarnedFee,
    totalUnclaimedFee,
  } = useMemo(() => aggregateFeeFromPositions(positions), [positions])

  const KemImageSize = upToSmall ? 20 : 24

  const claimRewardButton = (
    <MouseoverTooltipDesktopOnly text={t`Claim all available farming rewards`} width="fit-content" placement="bottom">
      <PositionAction
        disabled={!claimableUsdValue}
        mobileAutoWidth
        outline
        onClick={onOpenClaimAllRewards}
        style={{ position: 'relative', top: 2 }}
      >
        <Text>{t`Claim`}</Text>
      </PositionAction>
    </MouseoverTooltipDesktopOnly>
  )

  return (
    <>
      {claimAllRewardsModal}

      <Flex
        flexDirection={!upToLarge ? 'row' : 'column'}
        alignItems="center"
        sx={{ gap: !upToLarge ? '20px' : '12px' }}
      >
        <BannerContainer>
          <BannerWrapper>
            <BannerDataItem>
              <Text color={theme.subText}>{t`Total Value`}</Text>

              {initialLoading ? (
                <BannerSkeleton width={90} height={28} />
              ) : (
                <Text
                  fontSize={24}
                  color={totalFeeValue && totalFeeValue > 0 ? theme.primary : theme.text}
                  sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '120px' }}
                >
                  {formatDisplayNumber(totalFeeValue, { style: 'currency', significantDigits: 4 })}
                </Text>
              )}
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <Text color={theme.subText}>{t`Earned Fees`}</Text>

              {initialLoading ? (
                <BannerSkeleton width={90} height={28} />
              ) : (
                <Text fontSize={24} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '120px' }}>
                  {formatDisplayNumber(totalEarnedFee, { style: 'currency', significantDigits: 4 })}
                </Text>
              )}
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <Text color={theme.subText}>{t`Total Unclaimed Fees`}</Text>

              {initialLoading ? (
                <BannerSkeleton width={90} height={28} />
              ) : (
                <Text fontSize={24} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '120px' }}>
                  {formatDisplayNumber(totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
                </Text>
              )}
            </BannerDataItem>
            {upToSmall && (
              <>
                {/* Total Rewards */}
                <Flex
                  justifyContent={'space-between'}
                  width={'100%'}
                  paddingTop={16}
                  sx={{ borderTop: `1px solid ${rgba(theme.white, 0.08)}` }}
                >
                  <Flex alignItems="center" sx={{ gap: 1 }}>
                    <Text color={theme.subText}>{t`Total Rewards`}</Text>
                    <IconKem width={KemImageSize} height={KemImageSize} />
                  </Flex>

                  {initialLoading ? (
                    <BannerSkeleton width={90} height={28} />
                  ) : (
                    <Text fontSize={24}>
                      {formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                    </Text>
                  )}
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: '12px', width: '100%' }} paddingLeft={12} marginTop={'-8px'}>
                  {/* Claimed */}
                  <BannerDataItem>
                    <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>

                    {initialLoading ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <Text fontSize={20}>
                        {formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                      </Text>
                    )}
                  </BannerDataItem>

                  {/* In Progress */}
                  <BannerDataItem>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      <Text fontSize={14} color={theme.subText}>{t`In-Progress`}</Text>
                      <InfoHelper
                        text={inProgressRewardTooltip({
                          pendingUsdValue,
                          vestingUsdValue,
                          tokens,
                        })}
                        size={16}
                        fontSize={12}
                        width="290px"
                      />
                    </Flex>

                    {initialLoading ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <Text fontSize={20}>
                        {formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                      </Text>
                    )}
                  </BannerDataItem>

                  {/* Claimable */}
                  <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
                    <Flex flexDirection={'column'} alignItems={'flex-start'} sx={{ gap: 2 }}>
                      <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>

                      {initialLoading ? (
                        <BannerSkeleton width={80} height={24} />
                      ) : (
                        <Text fontSize={20}>
                          {formatDisplayNumber(claimableUsdValue, { significantDigits: 4, style: 'currency' })}
                        </Text>
                      )}
                    </Flex>
                    {claimRewardButton}
                  </Flex>
                </Flex>
              </>
            )}
          </BannerWrapper>
        </BannerContainer>

        {!upToSmall && (
          <BannerContainer>
            <RewardBannerWrapper>
              {/* Total Rewards */}
              <Flex alignItems={'center'} sx={{ gap: 3 }}>
                <Flex alignItems={'center'} sx={{ gap: 2 }}>
                  <IconKem width={KemImageSize} height={KemImageSize} style={{ position: 'relative', top: 2 }} />
                  <Text color={theme.subText}>{t`Total Rewards`}</Text>
                </Flex>

                {initialLoading ? (
                  <BannerSkeleton width={110} height={28} />
                ) : (
                  <Flex alignItems={'center'} sx={{ gap: 1 }}>
                    <Text fontSize={upToSmall ? 20 : 24}>
                      {formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                    </Text>
                    <InfoHelper
                      text={totalRewardTooltip({
                        lmTokens,
                        egTokens,
                        textColor: theme.text,
                      })}
                      placement="bottom"
                      width="160px"
                      size={16}
                      fontSize={14}
                    />
                  </Flex>
                )}
              </Flex>
              <RewardBannerDetailWrapper>
                {/* Claimed */}
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>

                  {initialLoading ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <Text fontSize={20}>
                      {formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  )}
                </BannerDataItem>
                <BannerDivider />
                {/* In-Progress */}
                <BannerDataItem>
                  <Flex alignItems={'center'} sx={{ gap: '2px' }}>
                    <Text fontSize={14} color={theme.subText}>{t`In-Progress`}</Text>
                    <InfoHelper
                      text={inProgressRewardTooltip({
                        pendingUsdValue,
                        vestingUsdValue,
                        tokens,
                      })}
                      size={16}
                      fontSize={12}
                      width="290px"
                    />
                  </Flex>

                  {initialLoading ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <Text fontSize={20}>
                      {formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  )}
                </BannerDataItem>
                <BannerDivider />
                {/* Claimable */}
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>

                  {initialLoading ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <Text fontSize={20}>
                      {formatDisplayNumber(claimableUsdValue, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  )}
                </BannerDataItem>

                {/* Claim */}
                {claimRewardButton}
              </RewardBannerDetailWrapper>
            </RewardBannerWrapper>
          </BannerContainer>
        )}
      </Flex>
    </>
  )
}
