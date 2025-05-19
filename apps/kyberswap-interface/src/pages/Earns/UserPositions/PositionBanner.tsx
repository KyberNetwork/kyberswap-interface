import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { PositionAction } from 'pages/Earns/PositionDetail/styles'
import {
  BannerContainer,
  BannerDataItem,
  BannerDivider,
  BannerWrapper,
  ListClaimableTokens,
  RewardBannerWrapper,
} from 'pages/Earns/UserPositions/styles'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ParsedPosition } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function PositionBanner({ positions }: { positions: Array<ParsedPosition> }) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { onOpenClaim: onOpenClaimRewards, rewardInfo, claimModal: claimRewardsModal } = useKemRewards()

  const rewardInfoThisChain = chainId ? rewardInfo?.chains.find(item => item.chainId === chainId) : null

  const totalRewardsAmount = rewardInfoThisChain?.totalAmount || 0
  const totalRewardsUsdValue = rewardInfoThisChain?.totalUsdValue || 0

  const claimableRewardsAmount = rewardInfoThisChain?.claimableAmount || 0
  const claimedRewardsUsdValue = rewardInfoThisChain?.claimedUsdValue || 0

  const pendingRewardsUsdValue = rewardInfoThisChain?.pendingUsdValue || 0
  const claimableRewardsUsdValue = rewardInfoThisChain?.claimableUsdValue || 0

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const overviewData = useMemo(() => {
    if (!positions) return
    const totalValue = positions.reduce((acc, position) => acc + position.totalValue, 0)
    const totalEarnedFee = positions.reduce((acc, position) => acc + position.earning.earned, 0)
    const totalUnclaimedFee = positions.reduce((acc, position) => acc + position.unclaimedFees, 0)

    return { totalValue, totalEarnedFee, totalUnclaimedFee }
  }, [positions])

  const rewardToken = 'KNC'
  const KemImageSize = upToSmall ? 20 : 24

  const claimRewardButton = (
    <MouseoverTooltipDesktopOnly text={t`Claim all available farming rewards`} width="fit-content" placement="bottom">
      <PositionAction
        disabled={!claimableRewardsUsdValue}
        mobileAutoWidth
        outline
        onClick={() => onOpenClaimRewards()}
        style={{ position: 'relative', top: 2 }}
      >
        <Text>{t`Claim`}</Text>
      </PositionAction>
    </MouseoverTooltipDesktopOnly>
  )

  return (
    <>
      {claimRewardsModal}

      <Flex
        flexDirection={!upToLarge ? 'row' : 'column'}
        alignItems="center"
        sx={{ gap: !upToLarge ? '20px' : '12px' }}
      >
        <BannerContainer>
          <BannerWrapper>
            <BannerDataItem>
              <Text color={theme.subText}>{t`Total Value`}</Text>
              <Text
                fontSize={24}
                color={overviewData?.totalValue && overviewData?.totalValue > 0 ? theme.primary : theme.text}
              >
                {formatDisplayNumber(overviewData?.totalValue, { style: 'currency', significantDigits: 4 })}
              </Text>
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <Text color={theme.subText}>{t`Earned Fees`}</Text>
              <Text fontSize={24}>
                {formatDisplayNumber(overviewData?.totalEarnedFee, { style: 'currency', significantDigits: 4 })}
              </Text>
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <Text color={theme.subText}>{t`Total Unclaimed Fees`}</Text>
              <Text fontSize={24}>
                {formatDisplayNumber(overviewData?.totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
              </Text>
            </BannerDataItem>
            {upToSmall && (
              <>
                <Flex alignItems={'flex-start'} justifyContent={'space-between'} width={'100%'}>
                  <Flex alignItems="center" sx={{ gap: 1 }}>
                    <Text color={theme.subText}>{t`Total Rewards`}</Text>
                    <IconKem width={KemImageSize} height={KemImageSize} />
                  </Flex>
                  <Flex flexDirection={'column'} alignItems={'flex-end'} sx={{ gap: 1 }}>
                    <Text fontSize={24}>
                      {formatDisplayNumber(totalRewardsUsdValue, { significantDigits: 4, style: 'currency' })}
                    </Text>
                    <Text color={theme.subText} fontSize={18}>
                      {formatDisplayNumber(totalRewardsAmount, { significantDigits: 4 })} {rewardToken}
                    </Text>
                  </Flex>
                </Flex>
                <Flex
                  alignItems={'flex-end'}
                  justifyContent={'space-between'}
                  width={'100%'}
                  sx={{ borderTop: `1px solid ${rgba(theme.white, 0.08)}` }}
                  paddingTop={'12px'}
                >
                  <Flex flexDirection={'column'} alignItems={'flex-start'} sx={{ gap: 2 }}>
                    <Flex alignItems="center" sx={{ gap: 1 }}>
                      <Text color={theme.subText}>{t`Claimable Rewards`}</Text>
                      <IconKem width={KemImageSize} height={KemImageSize} />
                    </Flex>
                    <Flex alignItems={'center'} sx={{ gap: 2 }}>
                      <Text fontSize={24}>
                        {formatDisplayNumber(claimableRewardsUsdValue, { significantDigits: 4, style: 'currency' })}
                      </Text>
                      <Text color={theme.subText} fontSize={18}>
                        {formatDisplayNumber(claimableRewardsAmount, { significantDigits: 4 })} {rewardToken}
                      </Text>
                    </Flex>
                  </Flex>
                  {claimRewardButton}
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
                  <IconKem width={KemImageSize} height={KemImageSize} style={{ position: 'relative', top: 2 }} />
                  <Text color={theme.subText}>{t`Total Rewards`}</Text>
                </Flex>
                <Text fontSize={upToSmall ? 20 : 24}>
                  {formatDisplayNumber(totalRewardsUsdValue, { significantDigits: 4, style: 'currency' })}
                </Text>
              </Flex>
              <Flex alignItems={'center'} justifyContent={'flex-start'} sx={{ gap: 4 }}>
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>
                  <Text fontSize={20}>
                    {formatDisplayNumber(claimedRewardsUsdValue, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </BannerDataItem>
                <BannerDivider />
                <BannerDataItem>
                  <Flex alignItems={'center'} sx={{ gap: '2px' }}>
                    <Text fontSize={14} color={theme.subText}>{t`Pending`}</Text>
                    <InfoHelper
                      text={t`Rewards that will be available within 2 days after the countdown completes.`}
                      width="330px"
                      placement="top"
                      size={16}
                    />
                  </Flex>
                  <Text fontSize={20}>
                    {formatDisplayNumber(pendingRewardsUsdValue, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </BannerDataItem>
                <BannerDivider />
                <BannerDataItem>
                  <Flex alignItems={'center'} sx={{ gap: '2px' }}>
                    <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>
                    <InfoHelper
                      text={
                        <>
                          <Text>
                            {t`Rewards you can claim right now`}
                            {claimableRewardsUsdValue ? '' : ': 0'}
                          </Text>
                          <ListClaimableTokens>
                            {rewardInfoThisChain?.claimableTokens.map((token, index) => (
                              <li key={`${token.address}-${index}`}>
                                {formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })} {token.symbol}
                              </li>
                            ))}
                          </ListClaimableTokens>
                        </>
                      }
                      width={claimableRewardsUsdValue ? '290px' : 'fit-content'}
                      placement="top"
                      size={16}
                    />
                  </Flex>
                  <Text fontSize={20}>
                    {formatDisplayNumber(claimableRewardsUsdValue, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </BannerDataItem>
                {claimRewardButton}
              </Flex>
            </RewardBannerWrapper>
          </BannerContainer>
        )}
      </Flex>
    </>
  )
}
