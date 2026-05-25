import { ShareModal, ShareModalProps, ShareType, TokenLogo } from '@kyber/ui'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
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
import { hexAlpha } from 'utils/colorAlpha'
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
      highlightColor={hexAlpha(theme.buttonGray, 0.5)}
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
        className="relative top-0.5"
      >
        <span>{t`Claim All`}</span>
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
      <Share2 size={14} className="text-primary" />
    </ShareButtonWrapper>
  )

  const shareModal = shareInfo ? <ShareModal isFarming {...shareInfo} /> : null

  return (
    <>
      {shareModal}

      <div className={`flex items-center ${!upToLarge ? 'flex-row gap-5' : 'flex-col gap-3'}`}>
        <BannerContainer>
          <BannerWrapper>
            <BannerDataItem>
              <span className="text-subText">{t`Total Value`}</span>

              {initialLoading ? (
                <BannerSkeleton width={90} height={28} />
              ) : (
                <p
                  className={`max-w-[140px] text-[24px] ${
                    totalValueUsd && totalValueUsd > 0 ? 'text-primary' : 'text-text'
                  }`}
                  style={LIMIT_TEXT_STYLES}
                >
                  <AnimatedNumber
                    value={formatDisplayNumber(totalValueUsd, { style: 'currency', significantDigits: 4 })}
                  />
                </p>
              )}
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <span className="text-subText">{t`Earned Fees`}</span>

              {initialLoading ? (
                <BannerSkeleton width={90} height={28} />
              ) : (
                <p className="max-w-[140px] text-[24px]" style={LIMIT_TEXT_STYLES}>
                  <AnimatedNumber
                    value={formatDisplayNumber(totalEarnedFeeUsd, { style: 'currency', significantDigits: 4 })}
                  />
                </p>
              )}
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <span className="text-subText">{t`Total Unclaimed Fees`}</span>

              {initialLoading ? (
                <BannerSkeleton width={90} height={28} />
              ) : (
                <p className="max-w-[140px] text-[24px]" style={LIMIT_TEXT_STYLES}>
                  <AnimatedNumber
                    value={formatDisplayNumber(totalUnclaimedFeeUsd, { style: 'currency', significantDigits: 4 })}
                  />
                </p>
              )}
            </BannerDataItem>
            {upToSmall && (
              <>
                <div className="flex w-full justify-between border-t border-solid border-white/[0.08] pt-4">
                  <div className="flex items-center gap-1">
                    <FarmingIcon width={KemImageSize} height={KemImageSize} />
                    <span className="mr-1 text-subText">{t`Total Rewards`}</span>
                    {shareBtn}
                  </div>

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={90} height={28} />
                  ) : (
                    <p className="text-[24px]">
                      <AnimatedNumber
                        value={formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                      />
                    </p>
                  )}
                </div>
                <div className="-mt-2 flex w-full flex-col gap-3 pl-3">
                  <BannerDataItem>
                    <span className="text-[14px] text-subText">{t`Claimed`}</span>

                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <p className="text-[20px]">
                        <AnimatedNumber
                          value={formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                        />
                      </p>
                    )}
                  </BannerDataItem>

                  <BannerDataItem>
                    <div className="flex items-center gap-1">
                      <span className="text-[14px] text-subText">{t`In-Progress`}</span>
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
                    </div>

                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <p className="text-[20px]">
                        <AnimatedNumber
                          value={formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                        />
                      </p>
                    )}
                  </BannerDataItem>

                  <div className="flex items-end justify-between">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-[14px] text-subText">{t`Claimable`}</span>

                      {isLoadingKemRewards ? (
                        <BannerSkeleton width={80} height={24} />
                      ) : (
                        <p className="text-[20px]">
                          <AnimatedNumber
                            value={formatDisplayNumber(totalClaimableUsdValue, {
                              significantDigits: 4,
                              style: 'currency',
                            })}
                          />
                        </p>
                      )}
                    </div>
                    {claimRewardButton}
                  </div>
                </div>
              </>
            )}
          </BannerWrapper>
        </BannerContainer>

        {!upToSmall && (
          <BannerContainer>
            <RewardBannerWrapper>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FarmingIcon width={KemImageSize} height={KemImageSize} className="relative top-0.5" />
                  <span className="text-subText">{t`Total Rewards`}</span>
                </div>

                {isLoadingKemRewards ? (
                  <BannerSkeleton width={110} height={28} />
                ) : (
                  <div className="flex items-center gap-1">
                    <p className={upToSmall ? 'text-[20px]' : 'text-[24px]'}>
                      <AnimatedNumber
                        value={formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                      />
                    </p>
                    <InfoHelper
                      text={totalRewardTooltip({
                        lmTokens,
                        egTokens,
                        merklRewards,
                        textColor: theme.text,
                      })}
                      placement="bottom"
                      width="220px"
                      size={16}
                      fontSize={14}
                      className="mr-3"
                    />
                    {shareBtn}
                  </div>
                )}
              </div>
              <RewardBannerDetailWrapper>
                <BannerDataItem>
                  <span className="text-[14px] text-subText">{t`Claimed`}</span>

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <p className="text-[20px]">
                      <AnimatedNumber
                        value={formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                      />
                    </p>
                  )}
                </BannerDataItem>
                <BannerDivider />
                <BannerDataItem>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[14px] text-subText">{t`In-Progress`}</span>
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
                  </div>

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <p className="text-[20px]">
                      <AnimatedNumber
                        value={formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                      />
                    </p>
                  )}
                </BannerDataItem>
                <BannerDivider />
                <BannerDataItem>
                  <span className="text-[14px] text-subText">{t`Claimable`}</span>

                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={80} height={24} />
                  ) : (
                    <p className="text-[20px]">
                      <AnimatedNumber
                        value={formatDisplayNumber(totalClaimableUsdValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      />
                    </p>
                  )}
                </BannerDataItem>

                {claimRewardButton}
              </RewardBannerDetailWrapper>
            </RewardBannerWrapper>
          </BannerContainer>
        )}
      </div>
    </>
  )
}

const merklRewardTooltip = (merklRewards: Array<TokenRewardInfo>, textColor: string) => (
  <div className="flex flex-col gap-1">
    <RewardLink
      href="https://app.merkl.xyz/users"
      target="_blank"
      style={{ lineHeight: '20px', fontSize: 14, color: '#fafafa', width: 'fit-content' }}
    >
      {t`3rd Party (Merkl) Incentives`}
    </RewardLink>
    <div className="pl-2">
      {merklRewards.map(token => (
        <div
          className="mt-1 flex flex-wrap items-center gap-1.5"
          key={`${token.chainId}-${token.address}-${token.symbol}`}
        >
          <TokenLogo src={token.logo} size={16} className="relative top-px" />
          <span style={{ color: textColor }}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
          <span style={{ color: textColor }}>{truncateSymbol(token.symbol)}</span>
        </div>
      ))}
    </div>
  </div>
)

const totalRewardTooltip = ({
  lmTokens,
  egTokens,
  merklRewards,
  textColor,
}: {
  lmTokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  merklRewards?: Array<TokenRewardInfo>
  textColor: string
}) => (
  <div className="flex flex-col gap-1">
    <p className="text-[14px] leading-5 text-[#fafafa]">{t`KyberSwap Reward`}</p>
    <div className="pl-2">
      <p className="mb-0.5 text-[12px] leading-4">
        {t`LM Reward:`}
        {!lmTokens.length ? ' 0' : ''}
      </p>
      {lmTokens.map(token => (
        <div className="flex flex-wrap items-center gap-1" key={`${token.address}-${token.symbol}`}>
          <TokenLogo src={token.logo} size={16} />
          <span style={{ color: textColor }}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
          <span style={{ color: textColor }}>{truncateSymbol(token.symbol)}</span>
        </div>
      ))}
      <p className="mb-0.5 mt-1 text-[12px] leading-4">
        {t`EG Sharing Reward:`}
        {!egTokens.length ? ' 0' : ''}
      </p>
      {egTokens.map(token => (
        <div className="flex flex-wrap items-center gap-1" key={`${token.address}-${token.symbol}`}>
          <TokenLogo src={token.logo} size={16} />
          <span style={{ color: textColor }}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
          <span style={{ color: textColor }}>{truncateSymbol(token.symbol)}</span>
        </div>
      ))}
    </div>

    {!!merklRewards?.length && (
      <>
        <HorizontalDivider />
        {merklRewardTooltip(merklRewards, textColor)}
      </>
    )}
  </div>
)
