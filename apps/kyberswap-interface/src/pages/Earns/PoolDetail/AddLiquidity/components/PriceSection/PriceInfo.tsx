import { Pool } from '@kyber/schema'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { getDisplayedPriceTokens } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/utils'
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

export const CurrentPriceHeader = ({
  pool,
  poolPrice,
  revertPrice,
  formattedPrice,
  onRevertPriceToggle,
}: {
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  formattedPrice: string
  onRevertPriceToggle?: () => void
}) => {
  const theme = useTheme()
  const { baseToken, quoteToken } = getDisplayedPriceTokens(pool, revertPrice)

  return (
    <HStack align="center" justify="space-between" gap={12}>
      <HStack flex="1 1 auto" align="center" gap={8} wrap="wrap">
        <Text color={theme.subText} fontSize={14}>
          Current Price
        </Text>
        <HStack color={theme.text} gap={4} wrap="wrap" fontSize={14}>
          <Text>1</Text>
          <Text>{baseToken.symbol}</Text>
          <Text>=</Text>
          <Text>{formattedPrice}</Text>
          <Text>{quoteToken.symbol}</Text>
        </HStack>
      </HStack>

      <RevertButton
        aria-label="Reverse price"
        disabled={poolPrice === null}
        onClick={onRevertPriceToggle}
        type="button"
      >
        <RevertPriceIcon width={12} height={12} />
      </RevertButton>
    </HStack>
  )
}

const PriceInfo = ({ pool, poolPrice, revertPrice, onRevertPriceToggle }: PriceInfoProps) => {
  const theme = useTheme()

  return (
    <Stack border={`1px solid ${theme.border}`} borderRadius={12} gap={8} p="8px 12px">
      <CurrentPriceHeader
        pool={pool}
        poolPrice={poolPrice}
        revertPrice={revertPrice}
        formattedPrice={formatDisplayNumber(poolPrice, { significantDigits: 8 })}
        onRevertPriceToggle={onRevertPriceToggle}
      />

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
