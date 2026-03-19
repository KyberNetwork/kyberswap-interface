import { Pool } from '@kyber/schema'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 12px;
  padding: 12px 16px;
`

const RangeBox = styled(HStack)`
  flex: 1 1 0;
  min-width: 0;
  align-items: stretch;
  border-radius: 12px;
  background: ${({ theme }) => theme.tabActive};
`

const RangeLabelBox = styled(Stack)`
  justify-content: center;
  padding: 8px 12px;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  background: ${({ theme }) => theme.background};
`

const RangeValueBox = styled(HStack)`
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
  padding: 8px 12px;
`

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

type PriceInfoProps = {
  pool: Pool
  priceRange: ZapState['priceRange']
}

const PriceInfo = ({ pool, priceRange }: PriceInfoProps) => {
  const theme = useTheme()
  const baseToken = priceRange.revertPrice ? pool.token1 : pool.token0
  const quoteToken = priceRange.revertPrice ? pool.token0 : pool.token1
  const isUniV3 = priceRange.minPrice !== null || priceRange.maxPrice !== null

  return (
    <Card gap={12}>
      <HStack align="center" justify="space-between" gap={12}>
        <HStack flex="1 1 auto" align="center" gap={8} wrap="wrap">
          <Text color={theme.subText}>Current Price</Text>
          <HStack gap={4} wrap="wrap">
            <Text>1</Text>
            <Text>{baseToken.symbol}</Text>
            <Text>=</Text>
            <Text>{formatDisplayNumber(priceRange.poolPrice, { significantDigits: 8 })}</Text>
            <Text>{quoteToken.symbol}</Text>
          </HStack>
        </HStack>

        <RevertButton aria-label="Reverse price" onClick={priceRange.toggleRevertPrice} type="button">
          <RevertPriceIcon width={12} height={12} />
        </RevertButton>
      </HStack>

      {isUniV3 && (
        <HStack gap={12}>
          <RangeBox>
            <RangeLabelBox>
              <Text fontSize={12} color={theme.subText}>
                MIN
              </Text>
            </RangeLabelBox>
            <RangeValueBox>
              <Text fontWeight={500}>{priceRange.minPrice}</Text>
            </RangeValueBox>
          </RangeBox>

          <RangeBox>
            <RangeLabelBox>
              <Text fontSize={12} color={theme.subText}>
                MAX
              </Text>
            </RangeLabelBox>
            <RangeValueBox>
              <Text fontWeight={500}>{priceRange.maxPrice}</Text>
            </RangeValueBox>
          </RangeBox>
        </HStack>
      )}
    </Card>
  )
}

export default PriceInfo
