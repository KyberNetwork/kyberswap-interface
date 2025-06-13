import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { PositionAction } from 'pages/Earns/PositionDetail/styles'
import {
  BannerContainer,
  BannerDataItem,
  BannerDivider,
  BannerWrapper,
  HorizontalDivider,
  RewardBannerWrapper,
} from 'pages/Earns/UserPositions/styles'
import { LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ParsedPosition } from 'pages/Earns/types'
import { aggregateFeeFromPositions, aggregateRewardFromPositions } from 'pages/Earns/utils/position'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function PositionBanner({ positions }: { positions: Array<ParsedPosition> }) {
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

  const inProgressTooltip = (
    <ul style={{ marginTop: 4, marginBottom: 4, paddingLeft: 20 }}>
      <li>
        {t`Current Cycle`}:{' '}
        {formatDisplayNumber(pendingUsdValue, {
          significantDigits: 4,
          style: 'currency',
        })}{' '}
        {t`will move to “Vesting” when this cycle ends.`}
      </li>
      <li style={{ marginTop: 4 }}>
        {t`Vesting`}:{' '}
        {formatDisplayNumber(vestingUsdValue, {
          significantDigits: 4,
          style: 'currency',
        })}{' '}
        {t`in a 2-day finalization period before they become claimable.`}
      </li>
    </ul>
  )

  const totalRewardInfoHelper = (
    <InfoHelper
      text={
        <Flex flexDirection={'column'} sx={{ gap: 1 }}>
          <HorizontalDivider />
          <Text lineHeight={'16px'} fontSize={12}>
            {t`LM Reward:`}
            {!lmTokens.length ? ' 0' : ''}
          </Text>
          {lmTokens.map(token => (
            <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'} key={token.address}>
              <TokenLogo src={token.logo} size={16} />
              <Text color={theme.text}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
              <Text color={theme.text}>{token.symbol}</Text>
            </Flex>
          ))}
          <Text lineHeight={'16px'} fontSize={12}>
            {t`EG Sharing Reward:`}
            {!egTokens.length ? ' 0' : ''}
          </Text>
          {egTokens.map(token => (
            <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'} key={token.address}>
              <TokenLogo src={token.logo} size={16} />
              <Text color={theme.text}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
              <Text color={theme.text}>{token.symbol}</Text>
            </Flex>
          ))}
        </Flex>
      }
      placement="bottom"
      width="160px"
      size={16}
    />
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
              <Text
                fontSize={24}
                color={totalFeeValue && totalFeeValue > 0 ? theme.primary : theme.text}
                sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '135px' }}
              >
                {formatDisplayNumber(totalFeeValue, { style: 'currency', significantDigits: 4 })}
              </Text>
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <Text color={theme.subText}>{t`Earned Fees`}</Text>
              <Text fontSize={24} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}>
                {formatDisplayNumber(totalEarnedFee, { style: 'currency', significantDigits: 4 })}
              </Text>
            </BannerDataItem>
            <BannerDivider />
            <BannerDataItem>
              <Text color={theme.subText}>{t`Total Unclaimed Fees`}</Text>
              <Text fontSize={24} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '140px' }}>
                {formatDisplayNumber(totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
              </Text>
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
                  <Text fontSize={24}>
                    {formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                  </Text>
                </Flex>
                <Flex flexDirection={'column'} sx={{ gap: '12px', width: '100%' }} paddingLeft={12} marginTop={'-8px'}>
                  {/* Claimed */}
                  <BannerDataItem>
                    <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>
                    <Text fontSize={20}>
                      {formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  </BannerDataItem>

                  {/* In Progress */}
                  <BannerDataItem>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      <Text fontSize={14} color={theme.subText}>{t`In-Progress`}</Text>
                      <InfoHelper text={inProgressTooltip} size={16} fontSize={12} width="280px" />
                    </Flex>
                    <Text fontSize={20}>
                      {formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  </BannerDataItem>

                  {/* Claimable */}
                  <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
                    <Flex flexDirection={'column'} alignItems={'flex-start'} sx={{ gap: 2 }}>
                      <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>
                      <Text fontSize={20}>
                        {formatDisplayNumber(claimableUsdValue, { significantDigits: 4, style: 'currency' })}
                      </Text>
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
                <Flex alignItems={'center'} sx={{ gap: 1 }}>
                  <Text fontSize={upToSmall ? 20 : 24}>
                    {formatDisplayNumber(totalUsdValue, { significantDigits: 4, style: 'currency' })}
                  </Text>
                  {totalRewardInfoHelper}
                </Flex>
              </Flex>
              <Flex alignItems={'center'} flexWrap={'wrap'} justifyContent={'flex-start'} sx={{ gap: 4, rowGap: 2 }}>
                {/* Claimed */}
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimed`}</Text>
                  <Text fontSize={20}>
                    {formatDisplayNumber(claimedUsdValue, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </BannerDataItem>
                <BannerDivider />
                {/* In-Progress */}
                <BannerDataItem>
                  <Flex alignItems={'center'} sx={{ gap: '2px' }}>
                    <Text fontSize={14} color={theme.subText}>{t`In-Progress`}</Text>
                    <InfoHelper text={inProgressTooltip} size={16} fontSize={12} width="280px" placement="top" />
                  </Flex>
                  <Text fontSize={20}>
                    {formatDisplayNumber(inProgressUsdValue, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </BannerDataItem>
                <BannerDivider />
                {/* Claimable */}
                <BannerDataItem>
                  <Text fontSize={14} color={theme.subText}>{t`Claimable`}</Text>
                  <Text fontSize={20}>
                    {formatDisplayNumber(claimableUsdValue, { style: 'currency', significantDigits: 4 })}
                  </Text>
                </BannerDataItem>

                {/* Claim */}
                {claimRewardButton}
              </Flex>
            </RewardBannerWrapper>
          </BannerContainer>
        )}
      </Flex>
    </>
  )
}
