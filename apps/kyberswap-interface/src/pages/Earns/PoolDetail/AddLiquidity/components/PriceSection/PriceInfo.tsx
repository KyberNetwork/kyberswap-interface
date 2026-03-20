import { Pool } from '@kyber/schema'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

const RevertButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    filter: brightness(1.12);
  }
`

interface PriceInfoProps {
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  onRevertPriceToggle?: () => void
}

const PriceInfo = ({ pool, poolPrice, revertPrice, onRevertPriceToggle }: PriceInfoProps) => {
  const theme = useTheme()
  const token0 = revertPrice ? pool.token1 : pool.token0
  const token1 = revertPrice ? pool.token0 : pool.token1

  return (
    <Stack border={`1px solid ${theme.border}`} borderRadius={12} gap={8} p="8px 12px">
      <HStack align="center" justify="space-between" gap={12}>
        <HStack flex="1 1 auto" align="center" gap={8} wrap="wrap">
          <Text color={theme.subText} fontSize={14}>
            Current Price
          </Text>
          <HStack color={theme.text} gap={4} wrap="wrap" fontSize={14}>
            <Text>1</Text>
            <Text>{token0.symbol}</Text>
            <Text>=</Text>
            <Text>{formatDisplayNumber(poolPrice, { significantDigits: 8 })}</Text>
            <Text>{token1.symbol}</Text>
          </HStack>
        </HStack>

        <RevertButton aria-label="Reverse price" onClick={onRevertPriceToggle} type="button">
          <RevertPriceIcon width={12} height={12} />
        </RevertButton>
      </HStack>

      {poolPrice === null && (
        <Stack borderRadius={8} background={rgba(theme.warning, 0.12)} p="8px 12px">
          <Text color={theme.text} fontSize={12} fontStyle="italic">
            Unable to get the market price. Please be cautious.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}

export default PriceInfo
