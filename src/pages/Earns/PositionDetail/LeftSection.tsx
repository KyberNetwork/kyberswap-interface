import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import { usePositionEarningStatisticsQuery } from 'services/zapEarn'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

import { ParsedPosition } from '.'
import { DexImage } from '../UserPositions/styles'
import { InfoLeftColumn, InfoRight, InfoSection, InfoSectionFirstFormat, VerticalDivider } from './styles'

const LeftSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()

  const { data: positionEarningStatistics } = usePositionEarningStatisticsQuery(
    {
      tokenAddress: position.tokenAddress,
      tokenId: position.id,
      chainId: position.chainId,
    },
    { skip: !position, pollingInterval: 15_000 },
  )

  const earning = useMemo(() => {
    if (!positionEarningStatistics || !positionEarningStatistics.length) return {}

    const reversedPositionEarningStatistics = [...positionEarningStatistics].reverse()
    const earning24h = reversedPositionEarningStatistics[0].totalEarning
    const earning7d = reversedPositionEarningStatistics.slice(0, 7).reduce((a, b) => a + b.totalEarning, 0)

    return {
      earning24h,
      earning7d,
    }
  }, [positionEarningStatistics])

  return (
    <InfoLeftColumn>
      <InfoSectionFirstFormat>
        <Text fontSize={14} color={theme.subText} marginTop={1}>
          {t`Total Liquidity`}
        </Text>
        <InfoRight>
          <Text fontSize={20}>
            {formatDisplayNumber(position.totalValue, {
              style: 'currency',
              significantDigits: 4,
            })}
          </Text>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage src={position.token0Logo} />
            <Text>{formatDisplayNumber(position.token0TotalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token0Symbol}</Text>
          </Flex>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage src={position.token1Logo} />
            <Text>{formatDisplayNumber(position.token1TotalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token1Symbol}</Text>
          </Flex>
        </InfoRight>
      </InfoSectionFirstFormat>
      <InfoSectionFirstFormat>
        <Flex alignItems={'center'} sx={{ marginTop: 1 }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Est. Position APR`}
          </Text>
          <InfoHelper text={t`Estimated 7 days APR`} placement="top" />
        </Flex>
        <Text fontSize={20} color={position.apr > 0 ? theme.primary : theme.text}>
          {formatDisplayNumber(position.apr * 100, {
            significantDigits: position.apr < 0.01 ? 2 : position.apr < 0.1 ? 3 : 4,
          })}
          %
        </Text>
      </InfoSectionFirstFormat>
      <InfoSection>
        <Text fontSize={14} color={theme.subText} marginBottom={3}>
          {t`Fee Earn`}
        </Text>
        <Flex alignItems={'center'} justifyContent={'space-between'}>
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              1 {t`day`}
            </Text>
            <Text>
              {earning.earning24h
                ? formatDisplayNumber(earning.earning24h, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              7 {t`days`}
            </Text>
            <Text>
              {earning.earning7d
                ? formatDisplayNumber(earning.earning7d, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              {t`All`}
            </Text>
            <Text fontSize={18} color={position.totalEarnedFee ? theme.primary : theme.text}>
              {position.totalEarnedFee
                ? formatDisplayNumber(position.totalEarnedFee, { style: 'currency', significantDigits: 4 })
                : '--'}
            </Text>
          </Flex>
        </Flex>
      </InfoSection>
      <InfoSectionFirstFormat>
        <Text fontSize={14} color={theme.subText} marginTop={1}>
          {t`Total Unclaimed Fee`}
        </Text>
        <InfoRight>
          <Text fontSize={20}>
            {formatDisplayNumber(position.totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
          </Text>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text>{formatDisplayNumber(position.token0UnclaimedAmount, { significantDigits: 4 })}</Text>
            <Text>{position.token0Symbol}</Text>
            <Text fontSize={14} color={theme.subText}>
              {formatDisplayNumber(position.token0UnclaimedValue, {
                style: 'currency',
                significantDigits: 4,
              })}
            </Text>
          </Flex>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text>{formatDisplayNumber(position.token1UnclaimedAmount, { significantDigits: 4 })}</Text>
            <Text>{position.token1Symbol}</Text>
            <Text fontSize={14} color={theme.subText}>
              {formatDisplayNumber(position.token1UnclaimedValue, {
                style: 'currency',
                significantDigits: 4,
              })}
            </Text>
          </Flex>
        </InfoRight>
      </InfoSectionFirstFormat>
    </InfoLeftColumn>
  )
}

export default LeftSection
