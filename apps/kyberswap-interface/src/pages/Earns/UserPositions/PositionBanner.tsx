import { ShareModal, ShareModalProps, ShareType, TokenLogo } from '@kyber/ui'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { Info, Share2, X } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { inProgressRewardTooltip } from 'pages/Earns/PositionDetail/RewardSection'
import { PositionAction, RewardLink, ShareButtonWrapper } from 'pages/Earns/PositionDetail/styles'
import {
  BannerContainer,
  BannerDataItem,
  BannerDivider,
  BannerWrapper,
  HorizontalDivider,
  RewardBannerDetailWrapper,
  RewardBannerWrapper,
} from 'pages/Earns/UserPositions/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import { LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import { RewardInfo, TokenRewardInfo, UserPositionsStats } from 'pages/Earns/types'
import { truncateSymbol } from 'pages/Earns/utils'
import { extractClaimedFeeStats } from 'pages/Earns/utils/position'
import { defaultRewardInfo } from 'pages/Earns/utils/reward'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const RewardTokenGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `}
`

const RewardInfoButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin-right: 12px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`

const RewardInfoModalClose = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`

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
  positionsStats,
  initialLoading,
  rewardInfo,
  isLoadingRewardInfo,
  onOpenClaimAllRewards,
}: {
  positionsStats?: UserPositionsStats
  initialLoading: boolean
  rewardInfo: RewardInfo | null
  isLoadingRewardInfo: boolean
  onOpenClaimAllRewards: () => void
}) {
  const theme = useTheme()
  const { rewards: merklRewards, totalUsdValue: totalMerklUsdValue } = useMerklRewards()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()
  const [showTotalRewardModal, setShowTotalRewardModal] = useState(false)

  const {
    totalUsdValue: totalKemUsdValue,
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

  const isLoadingKemRewards = initialLoading || isLoadingRewardInfo
  const totalUsdValue = totalKemUsdValue + totalMerklUsdValue
  const totalClaimableUsdValue = claimableUsdValue + totalMerklUsdValue

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { totalValueUsd, totalEarnedFeeUsd, totalUnclaimedFeeUsd } = extractClaimedFeeStats(positionsStats)

  const KemImageSize = upToSmall ? 20 : 24

  const claimRewardButton = (
    <MouseoverTooltipDesktopOnly text={t`Claim all available farming rewards`} width="fit-content" placement="bottom">
      <PositionAction
        disabled={(!claimableUsdValue && !totalMerklUsdValue) || initialLoading || isLoadingRewardInfo}
        mobileAutoWidth
        outline
        onClick={onOpenClaimAllRewards}
        style={{ position: 'relative', top: 2 }}
      >
        <Text>{t`Claim All`}</Text>
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

  const totalRewardModal = (
    <Modal isOpen={showTotalRewardModal} maxWidth={460} onDismiss={() => setShowTotalRewardModal(false)}>
      <Stack width="100%" padding="20px" borderRadius="20px" background={theme.background} color={theme.text} gap={20}>
        <HStack align="center" justify="space-between">
          <Text fontSize={20} fontWeight={500}>
            {t`Total Rewards`}: {formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
          </Text>
          <RewardInfoModalClose type="button" aria-label={t`Close`} onClick={() => setShowTotalRewardModal(false)}>
            <X size={20} />
          </RewardInfoModalClose>
        </HStack>
        <TotalRewardInfo lmTokens={lmTokens} egTokens={egTokens} merklRewards={merklRewards} />
      </Stack>
    </Modal>
  )

  return (
    <>
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
                  color={totalValueUsd && totalValueUsd > 0 ? theme.primary : theme.text}
                  sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}
                >
                  <AnimatedNumber
                    value={formatDisplayNumber(totalValueUsd, { style: 'currency', significantDigits: 4 })}
                  />
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
                  <AnimatedNumber
                    value={formatDisplayNumber(totalEarnedFeeUsd, { style: 'currency', significantDigits: 4 })}
                  />
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
                  <AnimatedNumber
                    value={formatDisplayNumber(totalUnclaimedFeeUsd, { style: 'currency', significantDigits: 4 })}
                  />
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

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={90} height={28} />
                  ) : (
                    <Text fontSize={24}>
                      <AnimatedNumber
                        value={formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                      />
                    </Text>
                  )}
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: '12px', width: '100%' }} paddingLeft={12} marginTop={'-8px'}>
                  <BannerDataItem>
                    <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>

                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <Text fontSize={20}>
                        <AnimatedNumber
                          value={formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                        />
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

                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <Text fontSize={20}>
                        <AnimatedNumber
                          value={formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                        />
                      </Text>
                    )}
                  </BannerDataItem>

                  <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
                    <Flex flexDirection={'column'} alignItems={'flex-start'} sx={{ gap: 2 }}>
                      <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>

                      {isLoadingKemRewards ? (
                        <BannerSkeleton width={80} height={24} />
                      ) : (
                        <Text fontSize={20}>
                          <AnimatedNumber
                            value={formatDisplayNumber(totalClaimableUsdValue, {
                              significantDigits: 4,
                              style: 'currency',
                            })}
                          />
                        </Text>
                      )}
                    </Flex>
                    {claimRewardButton}
                  </Flex>
                </Flex>
              </>
            )}
          </BannerWrapper>

          {shareModal}
          {totalRewardModal}
        </BannerContainer>

        {!upToSmall && (
          <BannerContainer>
            <RewardBannerWrapper>
              <Flex alignItems={'center'} sx={{ gap: 3 }}>
                <Flex alignItems={'center'} sx={{ gap: 2 }}>
                  <FarmingIcon width={KemImageSize} height={KemImageSize} style={{ position: 'relative', top: 2 }} />
                  <Text color={theme.subText}>{t`Total Rewards`}</Text>
                </Flex>

                {isLoadingKemRewards ? (
                  <BannerSkeleton width={110} height={28} />
                ) : (
                  <Flex alignItems={'center'} sx={{ gap: 1 }}>
                    <Text fontSize={upToSmall ? 20 : 24}>
                      <AnimatedNumber
                        value={formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                      />
                    </Text>
                    <RewardInfoButton
                      type="button"
                      aria-label={t`View total rewards details`}
                      onClick={() => setShowTotalRewardModal(true)}
                    >
                      <Info size={16} />
                    </RewardInfoButton>
                    {shareBtn}
                  </Flex>
                )}
              </Flex>
              <RewardBannerDetailWrapper>
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <Text fontSize={20}>
                      <AnimatedNumber
                        value={formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                      />
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

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <Text fontSize={20}>
                      <AnimatedNumber
                        value={formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                      />
                    </Text>
                  )}
                </BannerDataItem>
                <BannerDivider />
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <Text fontSize={20}>
                      <AnimatedNumber
                        value={formatDisplayNumber(totalClaimableUsdValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      />
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

type TotalRewardInfoProps = {
  lmTokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  merklRewards?: Array<TokenRewardInfo>
}

const TotalRewardInfo = ({ lmTokens, egTokens, merklRewards }: TotalRewardInfoProps) => {
  const theme = useTheme()

  return (
    <Stack gap={12}>
      <Text fontWeight={500}>{t`KyberSwap Reward`}</Text>
      <Stack gap={8} pl={2}>
        <Text fontSize={14} fontWeight={500} color={theme.subText}>
          {t`LM Reward:`}
          {!lmTokens.length ? ' 0' : ''}
        </Text>
        {!!lmTokens.length && (
          <RewardTokenGrid>
            {lmTokens.map(token => (
              <HStack key={`${token.address}-${token.symbol}`} align="center" gap="6px" style={{ minWidth: 0 }}>
                <TokenLogo src={token.logo} size={16} />
                <Text color={theme.text}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
                <Text color={theme.text}>{truncateSymbol(token.symbol)}</Text>
              </HStack>
            ))}
          </RewardTokenGrid>
        )}
      </Stack>
      <Stack gap={8} pl={2}>
        <Text fontSize={14} fontWeight={500} color={theme.subText}>
          {t`EG Sharing Reward:`}
          {!egTokens.length ? ' 0' : ''}
        </Text>
        {!!egTokens.length && (
          <RewardTokenGrid>
            {egTokens.map(token => (
              <HStack key={`${token.address}-${token.symbol}`} align="center" gap={6}>
                <TokenLogo src={token.logo} size={16} />
                <Text color={theme.text}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
                <Text color={theme.text}>{truncateSymbol(token.symbol)}</Text>
              </HStack>
            ))}
          </RewardTokenGrid>
        )}
      </Stack>

      {!!merklRewards?.length && (
        <>
          <HorizontalDivider />
          <RewardLink
            href="https://app.merkl.xyz/users"
            target="_blank"
            style={{ fontWeight: 500, color: '#fafafa', width: 'fit-content' }}
          >
            {t`3rd Party (Merkl) Incentives`}
          </RewardLink>
          <RewardTokenGrid pl={2}>
            {merklRewards.map(token => (
              <HStack key={`${token.chainId}-${token.address}-${token.symbol}`} align="center" gap={6}>
                <TokenLogo src={token.logo} size={16} style={{ position: 'relative', top: 1 }} />
                <Text color={theme.text}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
                <Text color={theme.text}>{truncateSymbol(token.symbol)}</Text>
              </HStack>
            ))}
          </RewardTokenGrid>
        </>
      )}
    </Stack>
  )
}
