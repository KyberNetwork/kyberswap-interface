import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { CustomBox } from 'pages/Earns/components/SmartExit/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export default function PositionLiquidity({ position }: { position: ParsedPosition }) {
  const theme = useTheme()

  return (
    <CustomBox>
      <Flex alignItems="center" justifyContent="space-between">
        <Text color={theme.subText} fontSize={14}>
          <Trans>Your Position Liquidity</Trans>
        </Text>
        <Text>{formatDisplayNumber(position.totalValue, { style: 'currency', significantDigits: 4 })}</Text>
      </Flex>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <TokenLogo src={position.token0.logo} size={16} />
          {position.token0.symbol}
        </Flex>
        <Flex flexDirection="column" sx={{ gap: '4px' }} alignItems="flex-end">
          <Text>{formatDisplayNumber(position.token0.totalProvide, { significantDigits: 6 })}</Text>
          <Text fontSize={12} color={theme.subText}>
            {formatDisplayNumber(position.token0.price * position.token0.totalProvide, {
              style: 'currency',
              significantDigits: 6,
            })}
          </Text>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <TokenLogo src={position.token1.logo} size={16} />
          {position.token1.symbol}
        </Flex>

        <Flex flexDirection="column" sx={{ gap: '4px' }} alignItems="flex-end">
          <Text>{formatDisplayNumber(position.token1.totalProvide, { significantDigits: 6 })}</Text>
          <Text fontSize={12} color={theme.subText}>
            {formatDisplayNumber(position.token1.price * position.token1.totalProvide, {
              style: 'currency',
              significantDigits: 6,
            })}
          </Text>
        </Flex>
      </Flex>
    </CustomBox>
  )
}
