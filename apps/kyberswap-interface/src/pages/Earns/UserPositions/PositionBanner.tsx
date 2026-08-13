import { ShareModal, ShareModalProps, ShareType, TokenLogo } from '@kyber/ui'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { Info, Share2, X } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { inProgressRewardTooltip } from 'pages/Earns/PositionDetail/RewardSection'
import { PositionAction, RewardLink, ShareButtonWrapper } from 'pages/Earns/PositionDetail/styles'
import {
  BannerContainer,
  BannerDataItem,
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
import { cn } from 'utils/cn'
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

const BannerValueSlot = ({
  children,
  compact = false,
  className,
}: {
  children: React.ReactNode
  compact?: boolean
  className?: string
}) => <div className={cn('flex items-center', compact ? 'h-6' : 'h-7', className)}>{children}</div>

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

  const { totalValueUsd, totalEarnedFeeUsd, totalUnclaimedFeeUsd } = extractClaimedFeeStats(positionsStats)

  const KemImageSize = upToSmall ? 20 : 24

  const claimRewardButton = (
    <MouseoverTooltipDesktopOnly text={t`Claim all available farming rewards`} width="fit-content" placement="bottom">
      <PositionAction
        disabled={(!claimableUsdValue && !totalMerklUsdValue) || initialLoading || isLoadingRewardInfo}
        mobileAutoWidth
        outline
        onClick={onOpenClaimAllRewards}
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

  const totalRewardModal = (
    <Modal isOpen={showTotalRewardModal} maxWidth={460} onDismiss={() => setShowTotalRewardModal(false)}>
      <div className="flex w-full flex-col gap-5 rounded-[20px] bg-background p-5 text-text">
        <div className="flex items-center justify-between">
          <span className="text-xl font-medium">
            {t`Total Rewards`}: {formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowTotalRewardModal(false)}
            className="flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-subText hover:text-text"
          >
            <X size={20} />
          </button>
        </div>
        <TotalRewardInfo lmTokens={lmTokens} egTokens={egTokens} merklRewards={merklRewards} />
      </div>
    </Modal>
  )

  return (
    <>
      {shareModal}
      {totalRewardModal}

      <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-4 max-lg:grid-cols-1">
        <BannerContainer className="h-full">
          <BannerWrapper className="h-full">
            <BannerDataItem className="pr-4 max-sm:p-0">
              <span className="text-subText">{t`Total Value`}</span>

              <BannerValueSlot>
                {initialLoading ? (
                  <BannerSkeleton width={90} height={28} />
                ) : (
                  <p
                    className={cn(
                      'max-w-[140px] text-2xl leading-7',
                      totalValueUsd && totalValueUsd > 0 ? 'text-primary' : 'text-text',
                    )}
                    style={LIMIT_TEXT_STYLES}
                  >
                    <AnimatedNumber
                      value={formatDisplayNumber(totalValueUsd, { style: 'currency', significantDigits: 4 })}
                    />
                  </p>
                )}
              </BannerValueSlot>
            </BannerDataItem>
            <BannerDataItem className="border-l-2 border-tabActive px-4 max-sm:border-0 max-sm:p-0">
              <span className="text-subText">{t`Earned Fees`}</span>

              <BannerValueSlot>
                {initialLoading ? (
                  <BannerSkeleton width={90} height={28} />
                ) : (
                  <p className="max-w-[140px] text-2xl leading-7" style={LIMIT_TEXT_STYLES}>
                    <AnimatedNumber
                      value={formatDisplayNumber(totalEarnedFeeUsd, { style: 'currency', significantDigits: 4 })}
                    />
                  </p>
                )}
              </BannerValueSlot>
            </BannerDataItem>
            <BannerDataItem className="border-l-2 border-tabActive pl-4 max-sm:border-0 max-sm:p-0">
              <span className="text-subText">{t`Total Unclaimed Fees`}</span>

              <BannerValueSlot>
                {initialLoading ? (
                  <BannerSkeleton width={90} height={28} />
                ) : (
                  <p className="max-w-[140px] text-2xl leading-7" style={LIMIT_TEXT_STYLES}>
                    <AnimatedNumber
                      value={formatDisplayNumber(totalUnclaimedFeeUsd, { style: 'currency', significantDigits: 4 })}
                    />
                  </p>
                )}
              </BannerValueSlot>
            </BannerDataItem>
            {upToSmall && (
              <>
                <div className="flex w-full items-center justify-between border-t border-solid border-white/[0.08] pt-3">
                  <div className="flex items-center gap-1">
                    <FarmingIcon width={KemImageSize} height={KemImageSize} />
                    <span className="mr-1 text-subText">{t`Total Rewards`}</span>
                    {shareBtn}
                  </div>

                  <BannerValueSlot className="justify-end">
                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={90} height={28} />
                    ) : (
                      <p className="text-2xl leading-7">
                        <AnimatedNumber
                          value={formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                        />
                      </p>
                    )}
                  </BannerValueSlot>
                </div>
                <div className="flex w-full flex-col gap-3">
                  <BannerDataItem>
                    <span className="text-[14px] text-subText">{t`Claimed`}</span>

                    <BannerValueSlot compact>
                      {isLoadingKemRewards ? (
                        <BannerSkeleton width={80} height={24} />
                      ) : (
                        <p className="text-xl leading-6">
                          <AnimatedNumber
                            value={formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                          />
                        </p>
                      )}
                    </BannerValueSlot>
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

                    <BannerValueSlot compact>
                      {isLoadingKemRewards ? (
                        <BannerSkeleton width={80} height={24} />
                      ) : (
                        <p className="text-xl leading-6">
                          <AnimatedNumber
                            value={formatDisplayNumber(inProgressUsdValue, {
                              style: 'currency',
                              significantDigits: 4,
                            })}
                          />
                        </p>
                      )}
                    </BannerValueSlot>
                  </BannerDataItem>

                  <div className="flex items-end justify-between">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[14px] text-subText">{t`Claimable`}</span>

                      <BannerValueSlot compact>
                        {isLoadingKemRewards ? (
                          <BannerSkeleton width={80} height={24} />
                        ) : (
                          <p className="text-xl leading-6">
                            <AnimatedNumber
                              value={formatDisplayNumber(totalClaimableUsdValue, {
                                significantDigits: 4,
                                style: 'currency',
                              })}
                            />
                          </p>
                        )}
                      </BannerValueSlot>
                    </div>
                    {claimRewardButton}
                  </div>
                </div>
              </>
            )}
          </BannerWrapper>
        </BannerContainer>

        {!upToSmall && (
          <BannerContainer className="h-full">
            <RewardBannerWrapper className="h-full gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FarmingIcon width={KemImageSize} height={KemImageSize} className="relative top-0.5" />
                  <span className="text-subText">{t`Total Rewards`}</span>
                </div>

                <BannerValueSlot className="w-[148px] shrink-0">
                  {isLoadingKemRewards ? (
                    <BannerSkeleton width={110} height={28} />
                  ) : (
                    <div className="flex items-center gap-1">
                      <p className="text-2xl leading-7">
                        <AnimatedNumber
                          value={formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                        />
                      </p>
                      <button
                        type="button"
                        aria-label="View total rewards details"
                        onClick={() => setShowTotalRewardModal(true)}
                        className="mr-2 flex size-4 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-subText hover:text-text"
                      >
                        <Info size={16} />
                      </button>
                      {shareBtn}
                    </div>
                  )}
                </BannerValueSlot>
              </div>
              <RewardBannerDetailWrapper>
                <BannerDataItem className="pr-4">
                  <span className="text-[14px] text-subText">{t`Claimed`}</span>

                  <BannerValueSlot compact>
                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <p className="text-xl leading-6">
                        <AnimatedNumber
                          value={formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                        />
                      </p>
                    )}
                  </BannerValueSlot>
                </BannerDataItem>
                <BannerDataItem className="border-l-2 border-tabActive px-4">
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

                  <BannerValueSlot compact>
                    {isLoadingKemRewards ? (
                      <BannerSkeleton width={80} height={24} />
                    ) : (
                      <p className="text-xl leading-6">
                        <AnimatedNumber
                          value={formatDisplayNumber(inProgressUsdValue, {
                            style: 'currency',
                            significantDigits: 4,
                          })}
                        />
                      </p>
                    )}
                  </BannerValueSlot>
                </BannerDataItem>
                <div className="flex min-w-0 items-end justify-between gap-3 border-l-2 border-tabActive pl-4">
                  <BannerDataItem>
                    <span className="text-[14px] text-subText">{t`Claimable`}</span>

                    <BannerValueSlot compact>
                      {isLoadingKemRewards ? (
                        <BannerSkeleton width={80} height={24} />
                      ) : (
                        <p className="text-xl leading-6">
                          <AnimatedNumber
                            value={formatDisplayNumber(totalClaimableUsdValue, {
                              style: 'currency',
                              significantDigits: 4,
                            })}
                          />
                        </p>
                      )}
                    </BannerValueSlot>
                  </BannerDataItem>

                  <div className="shrink-0">{claimRewardButton}</div>
                </div>
              </RewardBannerDetailWrapper>
            </RewardBannerWrapper>
          </BannerContainer>
        )}
      </div>
    </>
  )
}

type TotalRewardInfoProps = {
  lmTokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  merklRewards?: Array<TokenRewardInfo>
}

const RewardTokenRow = ({ token }: { token: TokenRewardInfo }) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <TokenLogo src={token.logo} size={16} />
    <span className="text-text">{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
    <span className="text-text">{truncateSymbol(token.symbol)}</span>
  </div>
)

const TotalRewardInfo = ({ lmTokens, egTokens, merklRewards }: TotalRewardInfoProps) => (
  <div className="flex flex-col gap-3">
    <p className="m-0 font-medium">{t`KyberSwap Reward`}</p>
    <div className="flex flex-col gap-2 pl-2">
      <p className="m-0 text-sm font-medium text-subText">
        {t`LM Reward:`}
        {!lmTokens.length ? ' 0' : ''}
      </p>
      {!!lmTokens.length && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 max-xs:grid-cols-1">
          {lmTokens.map(token => (
            <RewardTokenRow key={`${token.address}-${token.symbol}`} token={token} />
          ))}
        </div>
      )}
    </div>
    <div className="flex flex-col gap-2 pl-2">
      <p className="m-0 text-sm font-medium text-subText">
        {t`EG Sharing Reward:`}
        {!egTokens.length ? ' 0' : ''}
      </p>
      {!!egTokens.length && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 max-xs:grid-cols-1">
          {egTokens.map(token => (
            <RewardTokenRow key={`${token.address}-${token.symbol}`} token={token} />
          ))}
        </div>
      )}
    </div>

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
        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 pl-2 max-xs:grid-cols-1">
          {merklRewards.map(token => (
            <RewardTokenRow key={`${token.chainId}-${token.address}-${token.symbol}`} token={token} />
          ))}
        </div>
      </>
    )}
  </div>
)
