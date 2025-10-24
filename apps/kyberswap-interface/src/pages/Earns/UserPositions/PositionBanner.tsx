import { ShareModal, ShareModalProps, ShareType } from '@kyber/ui'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Share2 } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { inProgressRewardTooltip, totalRewardTooltip } from 'pages/Earns/PositionDetail/RewardSection'
import { PositionAction, ShareButtonWrapper } from 'pages/Earns/PositionDetail/styles'
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
import { aggregateFeeFromPositions } from 'pages/Earns/utils/position'
import { defaultRewardInfo } from 'pages/Earns/utils/reward'
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
  const { claimAllRewardsModal, onOpenClaimAllRewards, rewardInfo } = useKemRewards()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()

  const {
    totalUsdValue,
    totalLmUsdValue,
    totalEgUsdValue,
    claimedUsdValue,
    inProgressUsdValue,
    pendingUsdValue,
    vestingUsdValue,
    waitingUsdValue,
    claimableUsdValue,
    tokens,
    egTokens,
    lmTokens,
  } = rewardInfo || defaultRewardInfo

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const {
    totalValue: totalFeeValue,
    totalEarnedFee,
    totalUnclaimedFee,
  } = useMemo(() => aggregateFeeFromPositions(positions), [positions])

  const KemImageSize = upToSmall ? 20 : 24

  const claimRewardButton = (
    <MouseoverTooltipDesktopOnly text={t`Claim all available farming rewards`} width="fit-content" placement="bottom">
      <PositionAction
        disabled={!claimableUsdValue || initialLoading}
        mobileAutoWidth
        outline
        onClick={onOpenClaimAllRewards}
        style={{ position: 'relative', top: 2 }}
      >
        <Text>{t`Claim`}</Text>
      </PositionAction>
    </MouseoverTooltipDesktopOnly>
  )

  const shareBtn = (
    <ShareButtonWrapper
      onClick={() =>
        setShareInfo({
          type: ShareType.REWARD_INFO,
          onClose: () => setShareInfo(undefined),
          reward: {
            total: totalUsdValue,
            lm: totalLmUsdValue,
            eg: totalEgUsdValue,
          },
        })
      }
    >
      <Share2 size={14} color={theme.primary} />
    </ShareButtonWrapper>
  )

  const shareModal = shareInfo ? <ShareModal isFarming {...shareInfo} /> : null

  return (
    <>
      {claimAllRewardsModal}
      {shareModal}

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
                  sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}
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
                <Text fontSize={24} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}>
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
                <Text fontSize={24} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}>
                  {formatDisplayNumber(totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
                </Text>
              )}
            </BannerDataItem>
            {upToSmall && (
              <>
                <Flex
                  justifyContent={'space-between'}
                  width={'100%'}
                  paddingTop={16}
                  sx={{ borderTop: `1px solid ${rgba(theme.white, 0.08)}` }}
                >
                  <Flex alignItems="center" sx={{ gap: 1 }}>
                    <FarmingIcon width={KemImageSize} height={KemImageSize} />
                    <Text color={theme.subText} marginRight={1}>{t`Total Rewards`}</Text>
                    {shareBtn}
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

                  <BannerDataItem>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      <Text fontSize={14} color={theme.subText}>{t`In-Progress`}</Text>
                      <InfoHelper
                        text={inProgressRewardTooltip({
                          pendingUsdValue,
                          vestingUsdValue,
                          waitingUsdValue,
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
              <Flex alignItems={'center'} sx={{ gap: 3 }}>
                <Flex alignItems={'center'} sx={{ gap: 2 }}>
                  <FarmingIcon width={KemImageSize} height={KemImageSize} style={{ position: 'relative', top: 2 }} />
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
                      style={{ marginRight: 12 }}
                    />
                    {shareBtn}
                  </Flex>
                )}
              </Flex>
              <RewardBannerDetailWrapper>
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
                <BannerDataItem>
                  <Flex alignItems={'center'} sx={{ gap: '2px' }}>
                    <Text fontSize={14} color={theme.subText}>{t`In-Progress`}</Text>
                    <InfoHelper
                      text={inProgressRewardTooltip({
                        pendingUsdValue,
                        vestingUsdValue,
                        waitingUsdValue,
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

                {claimRewardButton}
              </RewardBannerDetailWrapper>
            </RewardBannerWrapper>
          </BannerContainer>
        )}
      </Flex>
    </>
  )
}
