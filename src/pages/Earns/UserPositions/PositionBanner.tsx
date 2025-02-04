import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { EarnPosition } from 'services/zapEarn'

import CopyHelper from 'components/Copy'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { BannerContainer, BannerDataItem, BannerDivider, BannerOverview, BannerWrapper } from './styles'

export default function PositionBanner({ userPosition }: { userPosition: Array<EarnPosition> | undefined }) {
  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const overviewData = useMemo(() => {
    if (!userPosition) return
    const totalValue = userPosition.reduce((acc, position) => acc + position.currentPositionValue, 0)
    const totalEarnedFee = userPosition.reduce(
      (acc, position) =>
        acc +
        position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
        position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0),
      0,
    )
    const totalUnclaimedFee = userPosition.reduce(
      (acc, position) => acc + position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0),
      0,
    )

    return { totalValue, totalEarnedFee, totalUnclaimedFee }
  }, [userPosition])

  return (
    <BannerContainer>
      <BannerWrapper>
        <Flex sx={{ gap: upToSmall ? 1 : 2 }}>
          <Text fontSize={upToSmall ? 18 : 20}>{account && shortenAddress(chainId, account, 4)}</Text>
          <CopyHelper size={16} toCopy={account || ''} />
        </Flex>
        <BannerDivider />
        <BannerOverview>
          <BannerDataItem>
            <Text color={theme.subText}>{t`Total Value`}</Text>
            <Text fontSize={upToSmall ? 20 : 24} color={theme.primary}>
              {formatDisplayNumber(overviewData?.totalValue, { style: 'currency', significantDigits: 6 })}
            </Text>
          </BannerDataItem>
          <BannerDataItem>
            <Text color={theme.subText}>{t`Earned Fee`}</Text>
            <Text fontSize={upToSmall ? 20 : 24}>
              {formatDisplayNumber(overviewData?.totalEarnedFee, { style: 'currency', significantDigits: 6 })}
            </Text>
          </BannerDataItem>
          <BannerDataItem>
            <Text color={theme.subText}>{t`Total Unclaimed Fee`}</Text>
            <Text fontSize={upToSmall ? 20 : 24}>
              {formatDisplayNumber(overviewData?.totalUnclaimedFee, { style: 'currency', significantDigits: 6 })}
            </Text>
          </BannerDataItem>
        </BannerOverview>
      </BannerWrapper>
    </BannerContainer>
  )
}
