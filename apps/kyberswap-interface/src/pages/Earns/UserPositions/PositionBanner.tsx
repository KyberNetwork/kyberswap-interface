import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { EarnPosition } from 'pages/Earns/types'

import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { BannerContainer, BannerDataItem, BannerDivider, BannerWrapper } from 'pages/Earns/UserPositions/styles'
import { PositionAction } from 'pages/Earns/PositionDetail/styles'
import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'

export default function PositionBanner({ positions }: { positions: Array<EarnPosition> | undefined }) {
  const theme = useTheme()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const overviewData = useMemo(() => {
    if (!positions) return
    const totalValue = positions.reduce((acc, position) => acc + position.currentPositionValue, 0)
    const totalEarnedFee = positions.reduce((acc, position) => {
      const feePending = position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)
      const feeClaimed = position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0)
      return acc + (feePending > 0 ? feePending : 0) + (feeClaimed > 0 ? feeClaimed : 0)
    }, 0)
    const totalUnclaimedFee = positions.reduce((acc, position) => {
      const feePending = position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)
      return acc + (position.feeInfo ? position.feeInfo.totalValue : feePending > 0 ? feePending : 0)
    }, 0)

    return { totalValue, totalEarnedFee, totalUnclaimedFee }
  }, [positions])

  const rewardsToken = 'KNC'
  const KEMSize = upToSmall ? 20 : 24

  const handleClaimAllRewards = () => {
    console.log('claim all rewards')
  }

  return (
    <BannerContainer>
      <BannerWrapper>
        <BannerDataItem>
          <Text color={theme.subText}>{t`Total Value`}</Text>
          <Text fontSize={upToSmall ? 20 : 24} color={theme.primary}>
            {formatDisplayNumber(overviewData?.totalValue, { style: 'currency', significantDigits: 4 })}
          </Text>
        </BannerDataItem>
        <BannerDivider />
        <BannerDataItem>
          <Text color={theme.subText}>{t`Earned Fees`}</Text>
          <Text fontSize={upToSmall ? 20 : 24}>
            {formatDisplayNumber(overviewData?.totalEarnedFee, { style: 'currency', significantDigits: 4 })}
          </Text>
        </BannerDataItem>
        <BannerDivider />
        <BannerDataItem>
          <Text color={theme.subText}>{t`Total Unclaimed Fees`}</Text>
          <Text fontSize={upToSmall ? 20 : 24}>
            {formatDisplayNumber(overviewData?.totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
          </Text>
        </BannerDataItem>
        <BannerDivider />
        <BannerDataItem>
          <Flex alignItems="center" sx={{ gap: 1 }}>
            <Text color={theme.subText}>{t`Total Rewards`}</Text>
            <IconKem width={KEMSize} height={KEMSize} />
          </Flex>
          <Text fontSize={upToSmall ? 20 : 24}>
            {formatDisplayNumber(234.5, { significantDigits: 4 })} {rewardsToken}
          </Text>
        </BannerDataItem>
        <BannerDivider />
        <BannerDataItem columnInMobile>
          <Flex alignItems="center" sx={{ gap: 1 }}>
            <Text color={theme.subText}>{t`Claimable Rewards`}</Text>
            <IconKem width={KEMSize} height={KEMSize} />
          </Flex>
          <Flex alignItems="center" justifyContent="space-between" sx={{ gap: 4 }}>
            <Text fontSize={upToSmall ? 20 : 24}>
              {formatDisplayNumber(12.5, { significantDigits: 4 })} {rewardsToken}
            </Text>
            <MouseoverTooltipDesktopOnly text={t`Claim all available farming rewards`} placement="bottom">
              <PositionAction mobileAutoWidth outline onClick={handleClaimAllRewards}>
                <Text>{t`Claim`}</Text>
              </PositionAction>
            </MouseoverTooltipDesktopOnly>
          </Flex>
        </BannerDataItem>
      </BannerWrapper>
    </BannerContainer>
  )
}
