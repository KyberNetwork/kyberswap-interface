import { Pool, defaultToken } from '@kyber/schema'
import { Skeleton } from '@kyber/ui'
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
  width: 28px;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  border-radius: 999px;
  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    filter: brightness(1.08);
  }
`

const Warning = styled(Text)`
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: ${({ theme }) => `${theme.warning}22`};
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-style: italic;
`

const CurrentPriceRow = styled(HStack)`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 400;
`

interface PriceInfoProps {
  pool?: Pool | null
  poolPrice: number | null
  revertPrice: boolean
  onRevertPriceToggle?: () => void
}

export default function PriceInfo({ pool, poolPrice, revertPrice, onRevertPriceToggle }: PriceInfoProps) {
  const theme = useTheme()
  const token0 = !pool ? defaultToken : revertPrice ? pool.token1 : pool.token0
  const token1 = !pool ? defaultToken : revertPrice ? pool.token0 : pool.token1

  return (
    <Stack
      gap={8}
      p="8px 16px"
      border={`1px solid ${theme.tabActive}`}
      borderRadius={12}
      background="rgba(255, 255, 255, 0.01)"
    >
      <HStack align="center" gap={12} justify="space-between">
        <CurrentPriceRow flex="1 1 auto" align="center" gap={8} wrap="wrap">
          <Text color={theme.subText} m={0}>
            Current Price
          </Text>
          {!pool ? (
            <Skeleton style={{ width: '120px', height: '20px' }} />
          ) : (
            <HStack gap={4}>
              <Text m={0}>1</Text>
              <Text m={0}>{token0.symbol}</Text>
              <Text m={0}>=</Text>
              <Text m={0}>{formatDisplayNumber(poolPrice, { significantDigits: 8 })}</Text>
              <Text m={0}>{token1.symbol}</Text>
            </HStack>
          )}
        </CurrentPriceRow>

        <RevertButton aria-label="Reverse price" onClick={onRevertPriceToggle} type="button">
          <RevertPriceIcon width={12} height={12} />
        </RevertButton>
      </HStack>

      {poolPrice === null && pool && <Warning>Unable to get the market price. Please be cautious.</Warning>}
    </Stack>
  )
}
