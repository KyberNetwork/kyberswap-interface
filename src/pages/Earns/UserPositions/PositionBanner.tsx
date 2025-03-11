import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { EarnPosition } from 'services/zapEarn'

import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { BannerContainer, BannerDataItem, BannerDivider, BannerWrapper } from './styles'

export default function PositionBanner({ positions }: { positions: Array<EarnPosition> | undefined }) {
  const theme = useTheme()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const overviewData = useMemo(() => {
    if (!positions) return
    const totalValue = positions.reduce((acc, position) => acc + position.currentPositionValue, 0)
    const totalEarnedFee = positions.reduce(
      (acc, position) =>
        acc +
        position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
        position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0),
      0,
    )
    const totalUnclaimedFee = positions.reduce(
      (acc, position) =>
        acc +
        (position.feeInfo
          ? position.feeInfo.totalValue
          : position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)),
      0,
    )

    return { totalValue, totalEarnedFee, totalUnclaimedFee }
  }, [positions])

  return (
    <BannerContainer>
      <BannerWrapper>
        <BannerDataItem>
          <Text color={theme.subText}>{t`Total Value`}</Text>
          <Text fontSize={upToSmall ? 20 : 24} color={theme.primary}>
            {formatDisplayNumber(overviewData?.totalValue, { style: 'currency', significantDigits: 6 })}
          </Text>
        </BannerDataItem>
        <BannerDivider />
        <BannerDataItem>
          <Text color={theme.subText}>{t`Earned Fee`}</Text>
          <Text fontSize={upToSmall ? 20 : 24}>
            {formatDisplayNumber(overviewData?.totalEarnedFee, { style: 'currency', significantDigits: 6 })}
          </Text>
        </BannerDataItem>
        <BannerDivider />
        <BannerDataItem>
          <Text color={theme.subText}>{t`Total Unclaimed Fee`}</Text>
          <Text fontSize={upToSmall ? 20 : 24}>
            {formatDisplayNumber(overviewData?.totalUnclaimedFee, { style: 'currency', significantDigits: 6 })}
          </Text>
        </BannerDataItem>
      </BannerWrapper>
    </BannerContainer>
  )
}
